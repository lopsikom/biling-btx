// Контракт ошибок, общий для фронта и бэка (ADR-0009).
//
// Два рода ошибок:
//   refusal (отказ) — ожидаемый отрицательный исход. Система отработала правильно,
//                     ответ — «нет». Адресован пользователю, в журнал не пишется.
//   fault   (сбой)  — неожиданный исход. Адресован разработчику, пишется в журнал
//                     целиком, пользователю показывается только error_id.
//
// Род задаёт автор ошибки явно; HTTP-код — следствие, а не признак рода:
// бывает ожидаемый 5xx (bitrix.token_expired) и требующий разбора 4xx
// (tenant.violation).

export type ErrorKind = 'refusal' | 'fault'

// Коды отказов — то, что пользователь может исправить сам или через админа портала.
export const REFUSAL_CODES = [
  'auth.no_token', // запрос без Authorization
  'auth.portal_not_found', // токен есть, но портал по нему не резолвится
  'role.forbidden', // роли виджета не хватает для действия
  'validation.failed', // тело/параметры не прошли валидацию
  'entity.not_found', // запрошенной сущности нет
  'portal.not_configured', // нет привязки смарт-процесса / каталога
  'bitrix.token_expired', // OAuth-токен портала протух, нужна переустановка
  // Отказ, пришедший из ещё не размеченного createError (4xx). Текст берётся
  // с сервера как есть. Появление в логах — сигнал, что место пора разметить.
  'refusal.unspecified'
] as const

// Коды сбоев — то, в чём разбирается разработчик.
export const FAULT_CODES = [
  'internal', // нераспознанное: баг, TypeError, всё неожиданное
  'tenant.violation', // запрос ресурса чужого портала — нарушение изоляции
  'bitrix.api_error', // Bitrix вернул error в теле при HTTP 200
  'bitrix.rate_limited', // QUERY_LIMIT_EXCEEDED
  'db.unavailable', // Postgres недоступен
  'redis.unavailable' // Redis недоступен
] as const

export type RefusalCode = typeof REFUSAL_CODES[number]
export type FaultCode = typeof FAULT_CODES[number]
export type ErrorCode = RefusalCode | FaultCode

// Структурные данные ошибки. Не текст для показа — сырьё, из которого фронт
// строит текст (напр. коды полей, которые он превратит в человеческие названия
// через метаданные IFieldMeta).
export interface ErrorDetails {
  fields?: string[]
  [key: string]: unknown
}

// Тело ответа при любой ошибке /api/**. Формируется server/error.ts.
export interface ApiErrorBody {
  error: true
  statusCode: number
  kind: ErrorKind
  code: ErrorCode
  // Фолбэк-текст на случай, если фронт не знает кода. Для fault всегда обезличен.
  message: string
  details?: ErrorDetails
  // Есть только у сбоя: отказ в журнал не пишется, опознавать нечего.
  error_id?: string
  ts: string
}

// Ошибка после нормализации на фронте: то, что получает каждый catch.
export interface NormalizedError extends ApiErrorBody {
  // true, если ответа не было вовсе (сеть, таймаут, отменённый запрос)
  offline?: boolean
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.error === true && typeof v.code === 'string' && typeof v.kind === 'string'
}
