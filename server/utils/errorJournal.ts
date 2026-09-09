import { appendFile, mkdir, rename, rm, stat } from 'node:fs/promises'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { newErrorId } from './errors'
import type { ErrorCode, ErrorDetails, ErrorKind } from '~~/shared/models/errors'

// Журнал ошибок (ADR-0009): отдельный поток только для сбоев.
//
// Консоль — краткая строка на любую ошибку, читается глазами через docker logs.
// Файл — полное досье только на сбой, JSON Lines: одна запись = одна строка,
// грепается по error_id и переживает пересоздание контейнера (том /app/logs).
//
// Это НЕ общий логгер приложения: прогресс синка и прочий операционный вывод
// сюда не идут и остаются обычным console.log.

const LOG_DIR = process.env.NUXT_LOG_DIR || 'logs'
const LOG_FILE = 'errors.log'
const MAX_BYTES = 10 * 1024 * 1024 // 10 МБ на файл
const MAX_FILES = 5 // errors.log + errors.1.log .. errors.4.log
const MAX_BODY_CHARS = 4096 // тело запроса в досье обрезается

// Сырые секреты пишутся только там, где явно сказано development.
// Белый список, а не «всё кроме production»: при undefined, опечатке или новом
// окружении (staging) поведение должно быть безопасным.
const RAW_MODE = process.env.NODE_ENV === 'development'

// Ключи, значения которых никогда не попадают в журнал в проде. Здесь лежат
// живые ключи от чужих порталов: Authorization — access_token пользователя,
// тело вебхука Bitrix несёт auth.refresh_token (долгоживущий), query OAuth — code.
const SECRET_KEYS = new Set([
  'authorization', 'auth', 'access_token', 'refresh_token', 'application_token',
  'client_secret', 'token', 'password', 'cookie', 'set-cookie'
])

// OAuth-код приходит query-параметром (/api/oauth/handler?code=…), то есть внутри
// строки URL, куда обход по ключам не достаёт. Здесь же 'code' не годится как
// секретный ключ объекта: так называется и наш собственный код ошибки, и поле
// ECONNREFUSED у сетевых ошибок — затирать их значит слепнуть при разборе.
const SECRET_QUERY_PARAMS = new Set([
  'code', 'auth', 'access_token', 'refresh_token', 'application_token',
  'client_secret', 'token'
])

function redactUrl(url: string | undefined): string | undefined {
  if (!url) return url
  const at = url.indexOf('?')
  if (at === -1) return url
  const params = new URLSearchParams(url.slice(at + 1))
  let touched = false
  for (const key of [...params.keys()]) {
    if (SECRET_QUERY_PARAMS.has(key.toLowerCase())) {
      params.set(key, '[redacted]')
      touched = true
    }
  }
  return touched ? `${url.slice(0, at)}?${params.toString().replaceAll('%5Bredacted%5D', '[redacted]')}` : url
}

// Откуда пришёл сбой. Различать обязательно: у фоновых источников нет запроса,
// и искать их в журнале приходится по порталу и источнику, а не по URL.
export type FaultSource = 'api' | 'webhook' | 'sync' | 'process'

export interface RequestSnapshot {
  method?: string
  url?: string
  headers?: Record<string, unknown>
  body?: unknown
}

export interface FaultContext {
  source: FaultSource
  portal_id?: number
  user_id?: number
  request?: RequestSnapshot
  // Опознавательные данные источника: id компании для синка, событие для вебхука.
  extra?: Record<string, unknown>
  // Процесс сейчас упадёт — писать синхронно, иначе запись потеряется.
  flush?: boolean
}

export interface RefusalContext {
  source: FaultSource
  portal_id?: number
  user_id?: number
  method?: string
  url?: string
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[deep]'
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1))
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(v, depth + 1)
    }
    return out
  }
  return value
}

function prepare(value: unknown): unknown {
  return RAW_MODE ? value : redact(value)
}

function truncate(value: unknown): unknown {
  if (value === undefined) return undefined
  const text = typeof value === 'string' ? value : safeStringify(value)
  if (text.length <= MAX_BODY_CHARS) return value
  return `${text.slice(0, MAX_BODY_CHARS)}… [обрезано, всего ${text.length} симв.]`
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return '[несериализуемо]'
  }
}

// Разворачивает цепочку cause: без неё в журнал попадёт стектрейс места
// переброса, а не места, где на самом деле сломалось.
function describeError(error: unknown, depth = 0): Record<string, unknown> | undefined {
  if (error === undefined || error === null || depth > 4) return undefined
  if (!(error instanceof Error)) return { value: prepare(error) }
  const e = error as Error & Record<string, unknown>
  const out: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: describeError(e.cause, depth + 1)
  }
  // Диагностические поля, по которым отличают «БД недоступна» от «БД отказала»:
  // без них у сетевой ошибки остаются только имя и текст.
  for (const key of ['code', 'errno', 'syscall', 'statusCode', 'address', 'port']) {
    if (e[key] !== undefined) out[key] = e[key]
  }
  return out
}

// Последовательная очередь записи: сбои могут прийти пачкой, а ротация
// переименовывает файлы — параллельная запись потеряла бы строки.
let writeQueue: Promise<void> = Promise.resolve()
let currentSize: number | null = null
let writeDisabled = false

async function rotateIfNeeded(dir: string, size: number) {
  if (size < MAX_BYTES) return
  await rm(join(dir, `${LOG_FILE}.${MAX_FILES - 1}`), { force: true })
  for (let i = MAX_FILES - 2; i >= 1; i--) {
    await rename(join(dir, `${LOG_FILE}.${i}`), join(dir, `${LOG_FILE}.${i + 1}`)).catch(() => {})
  }
  await rename(join(dir, LOG_FILE), join(dir, `${LOG_FILE}.1`)).catch(() => {})
  currentSize = 0
}

async function writeLine(line: string) {
  if (writeDisabled) return
  try {
    await mkdir(LOG_DIR, { recursive: true })
    if (currentSize === null) {
      currentSize = await stat(join(LOG_DIR, LOG_FILE)).then(s => s.size).catch(() => 0)
    }
    await rotateIfNeeded(LOG_DIR, currentSize)
    await appendFile(join(LOG_DIR, LOG_FILE), line, 'utf8')
    currentSize += Buffer.byteLength(line)
  } catch (e) {
    // Журнал не имеет права ронять приложение. Сообщаем один раз и замолкаем:
    // самая вероятная причина — не смонтирован том или нет прав на запись.
    writeDisabled = true
    console.error(`[журнал ошибок] запись в ${join(LOG_DIR, LOG_FILE)} невозможна, журнал отключён:`, e)
  }
}

function enqueue(line: string) {
  writeQueue = writeQueue.then(() => writeLine(line)).catch(() => {})
}

// Синхронная запись для фатального случая: процесс вот-вот упадёт, и очередь
// с асинхронным appendFile до диска уже не доедет. Ротацию здесь не делаем —
// одна лишняя строка сверх лимита безопаснее потерянной записи о падении.
function writeLineSync(line: string) {
  if (writeDisabled) return
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(join(LOG_DIR, LOG_FILE), line, 'utf8')
    if (currentSize !== null) currentSize += Buffer.byteLength(line)
  } catch (e) {
    writeDisabled = true
    console.error(`[журнал ошибок] синхронная запись невозможна:`, e)
  }
}

function consoleLine(kind: ErrorKind, id: string, code: ErrorCode, statusCode: number, ctx: {
  method?: string
  url?: string
  portal_id?: number
  user_id?: number
  source: FaultSource
}, message: string) {
  const where = ctx.method && ctx.url ? `${ctx.method} ${ctx.url}` : ctx.source
  const who = [
    ctx.portal_id !== undefined ? `portal=${ctx.portal_id}` : null,
    ctx.user_id !== undefined ? `user=${ctx.user_id}` : null
  ].filter(Boolean).join(' ')
  const tail = message ? ` — ${message}` : ''
  return `[${kind}] ${id} ${code} ${statusCode} ${where}${who ? ' ' + who : ''}${tail}`
}

// Отказ: только краткая строка в консоль, в файл не пишется.
export function recordRefusal(
  code: ErrorCode,
  statusCode: number,
  message: string,
  ctx: RefusalContext
): void {
  console.warn(consoleLine('refusal', '-', code, statusCode, ctx, message))
}

// Сбой: краткая строка в консоль + полное досье в файл. Возвращает error_id,
// который уходит пользователю — по нему запись находится в журнале.
export function recordFault(
  error: unknown,
  code: ErrorCode,
  statusCode: number,
  ctx: FaultContext,
  details?: ErrorDetails
): string {
  const id = newErrorId()
  const ts = new Date().toISOString()
  const message = error instanceof Error ? error.message : safeStringify(error)

  console.error(consoleLine('fault', id, code, statusCode, {
    method: ctx.request?.method,
    url: ctx.request?.url,
    portal_id: ctx.portal_id,
    user_id: ctx.user_id,
    source: ctx.source
  }, message))

  const entry = {
    ts,
    error_id: id,
    kind: 'fault' as const,
    code,
    statusCode,
    source: ctx.source,
    portal_id: ctx.portal_id,
    user_id: ctx.user_id,
    details,
    request: ctx.request
      ? {
          method: ctx.request.method,
          url: RAW_MODE ? ctx.request.url : redactUrl(ctx.request.url),
          headers: prepare(ctx.request.headers),
          body: truncate(prepare(ctx.request.body))
        }
      : undefined,
    extra: ctx.extra ? prepare(ctx.extra) : undefined,
    error: describeError(error)
  }

  const line = JSON.stringify(entry) + '\n'
  if (ctx.flush) writeLineSync(line)
  else enqueue(line)
  return id
}

// Путь к журналу — для стартового сообщения и диагностики.
export function journalPath(): string {
  return join(LOG_DIR, LOG_FILE)
}
