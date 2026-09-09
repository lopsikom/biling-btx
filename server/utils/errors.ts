import { randomBytes } from 'node:crypto'
import type { H3Error } from 'h3'
import type { ErrorDetails, ErrorKind, ErrorCode, FaultCode, RefusalCode } from '~~/shared/models/errors'

// Фабрики ошибок (ADR-0009). В новом коде вместо createError используются они:
// род ошибки — явное свойство, а не догадка по статус-коду.

// Метка, которую фабрики кладут в data ошибки. Оттуда её читает
// classifyError, и оттуда же она штатно уезжает клиенту в теле ответа.
export interface ErrorMark {
  kind: ErrorKind
  code: ErrorCode
  details?: ErrorDetails
}

interface RefusalOptions {
  // Фолбэк-текст, если фронт не знает кода. Пишется на русском — его увидит пользователь.
  message?: string
  details?: ErrorDetails
  cause?: unknown
}

interface FaultOptions extends RefusalOptions {
  statusCode?: number
}

// Короткий идентификатор случая: пользователь диктует его по телефону,
// разработчик грепает по журналу. 6 hex-символов достаточно — вместе с timestamp
// коллизия неразличимых записей практически исключена.
export function newErrorId(): string {
  return randomBytes(3).toString('hex')
}

// Отказ — ожидаемый отрицательный исход, адресован пользователю.
export function refusal(code: RefusalCode, statusCode: number, opts: RefusalOptions = {}): H3Error {
  return createError({
    statusCode,
    statusMessage: code,
    message: opts.message ?? '',
    data: { kind: 'refusal', code, details: opts.details } satisfies ErrorMark,
    cause: opts.cause
  })
}

// Сбой — неожиданный исход, адресован разработчику. cause сохраняет исходную
// ошибку: без неё в журнал попадёт стектрейс места переброса, а не места поломки.
export function fault(code: FaultCode, opts: FaultOptions = {}): H3Error {
  return createError({
    statusCode: opts.statusCode ?? 500,
    statusMessage: code,
    message: opts.message ?? '',
    data: { kind: 'fault', code, details: opts.details } satisfies ErrorMark,
    cause: opts.cause
  })
}

function readMark(error: unknown): ErrorMark | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const data = (error as { data?: unknown }).data
  if (typeof data !== 'object' || data === null) return undefined
  const mark = data as Partial<ErrorMark>
  if (mark.kind !== 'refusal' && mark.kind !== 'fault') return undefined
  if (typeof mark.code !== 'string') return undefined
  return mark as ErrorMark
}

export interface Classified {
  kind: ErrorKind
  code: ErrorCode
  statusCode: number
  details?: ErrorDetails
  // Текст от автора ошибки. Для отказа — фолбэк пользователю, для сбоя — только в журнал.
  message: string
}

// Определяет род ошибки. Размеченное фабриками — по метке; всё остальное —
// переходной эвристикой: 4xx считаем отказом, 5xx и не-HTTP — сбоем.
// Эвристика существует, чтобы 126 неразмеченных createError вели себя разумно
// без правки каждого; размечать вручную нужно только там, где она врёт
// (bitrix.token_expired — 5xx, но отказ; tenant.violation — 4xx, но сбой).
export function classifyError(error: unknown): Classified {
  const statusCode = typeof (error as { statusCode?: unknown })?.statusCode === 'number'
    ? (error as { statusCode: number }).statusCode
    : 500
  const message = typeof (error as { message?: unknown })?.message === 'string'
    ? (error as { message: string }).message
    : ''

  const mark = readMark(error)
  if (mark) {
    return { kind: mark.kind, code: mark.code, statusCode, details: mark.details, message }
  }

  const isHttpRefusal = statusCode >= 400 && statusCode < 500
  return isHttpRefusal
    ? { kind: 'refusal', code: 'refusal.unspecified', statusCode, message }
    : { kind: 'fault', code: 'internal', statusCode, message }
}

// Детали валидации для отказа: коды полей, не прошедших проверку. Именно коды,
// а не готовый текст — человеческие названия у динамических полей знает только
// фронт (IFieldMeta.title из метаданных портала), сервер их не хранит.
export function zodFields(error: unknown): ErrorDetails | undefined {
  const issues = (error as { issues?: { path?: (string | number)[] }[] })?.issues
  if (!Array.isArray(issues)) return undefined
  const fields = issues.map(i => (i.path ?? []).join('.')).filter(Boolean)
  return fields.length ? { fields } : undefined
}
