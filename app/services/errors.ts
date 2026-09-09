import type { ErrorCode, ErrorDetails, NormalizedError } from '~~/shared/models/errors'
import { isApiErrorBody } from '~~/shared/models/errors'
import useBillingStateStore from '~/services/stores/billingStateStore'

// Разбор и показ ошибок на фронте (ADR-0009).
//
// Сервер присылает код причины и структурные details, но НЕ текст для показа:
// человеческие названия полей знает только фронт — они приходят в метаданных
// портала (IFieldMeta.title) и различаются от портала к порталу. Поэтому текст
// собирается здесь, а серверный message остаётся фолбэком на случай кода,
// которого фронт ещё не знает.

// Приводит что угодно (ошибку axios, сетевой обрыв, случайный throw)
// к единому виду, с которым работают компоненты.
export function normalizeError(e: unknown): NormalizedError {
  const response = (e as { response?: { data?: unknown, status?: number } })?.response

  if (isApiErrorBody(response?.data)) return response.data

  // Ответа нет вовсе: виджет живёт в iframe Bitrix, где обрыв связи —
  // обычное дело (спящая вкладка, смена сети, закрытие портала).
  if (e && typeof e === 'object' && 'request' in e && !response) {
    return {
      error: true,
      statusCode: 0,
      kind: 'fault',
      code: 'internal',
      message: 'Нет связи с сервером',
      offline: true,
      ts: new Date().toISOString()
    }
  }

  return {
    error: true,
    statusCode: response?.status ?? 0,
    kind: 'fault',
    code: 'internal',
    message: e instanceof Error ? e.message : 'Неизвестная ошибка',
    ts: new Date().toISOString()
  }
}

// Код поля Bitrix → его человеческое название из метаданных портала.
// Ищем среди полей договора и среди полей всех видов модулей: на момент ошибки
// неизвестно, к какой форме относился запрос.
function fieldLabel(code: string): string {
  try {
    const store = useBillingStateStore()
    const own = code.split('.').pop() ?? code
    const all = [store.contractFields, ...Object.values(store.moduleFieldsByKind)].flat()
    return all.find(f => f.code === own)?.title ?? own
  } catch {
    return code
  }
}

function fieldList(details?: ErrorDetails): string {
  const fields = details?.fields ?? []
  return fields.map(fieldLabel).join(', ')
}

// Тексты отказов. Фронт обязан покрыть все коды — иначе тайпчек не пропустит,
// и «добавили код на бэке, забыли текст» становится ошибкой сборки.
const MESSAGES: Record<ErrorCode, (details?: ErrorDetails) => string> = {
  'auth.no_token': () => 'Виджет открыт вне Bitrix24 — авторизация недоступна',
  'auth.portal_not_found': () => 'Портал не найден. Возможно, приложение было переустановлено — обновите страницу',
  'role.forbidden': () => 'Недостаточно прав для этого действия',
  'validation.failed': d => d?.fields?.length
    ? `Проверьте поля: ${fieldList(d)}`
    : 'Не все поля заполнены корректно',
  'entity.not_found': () => 'Объект не найден — возможно, он уже удалён',
  'portal.not_configured': () => 'Приложение не настроено. Откройте раздел «Поля» и укажите привязку.',
  'bitrix.token_expired': () => 'Приложение потеряло доступ к Bitrix24. Переустановите его в разделе «Приложения».',
  'refusal.unspecified': () => 'Не удалось выполнить действие',
  // Коды сбоев в словаре не используются: сбой всегда показывается одинаково,
  // с error_id. Записи нужны, чтобы Record покрывал весь реестр.
  'internal': () => 'Произошла ошибка',
  'tenant.violation': () => 'Произошла ошибка',
  'bitrix.api_error': () => 'Произошла ошибка',
  'bitrix.rate_limited': () => 'Произошла ошибка',
  'db.unavailable': () => 'Произошла ошибка',
  'redis.unavailable': () => 'Произошла ошибка'
}

// Текст для пользователя. Сбой не показывает подробностей — только код,
// который пользователь называет в обращении; всё остальное лежит в журнале.
export function errorText(e: NormalizedError): string {
  if (e.offline) return 'Нет связи с сервером. Проверьте подключение и повторите.'
  if (e.kind === 'fault') {
    return e.error_id
      ? `Произошла ошибка. Код: ${e.error_id}`
      : 'Произошла ошибка. Повторите попытку позже.'
  }
  const known = MESSAGES[e.code]
  return known ? known(e.details) : (e.message || 'Не удалось выполнить действие')
}
