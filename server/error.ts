import type { H3Event } from 'h3'
import { getRequestHeaders, send, setResponseHeader, setResponseStatus } from 'h3'
import { classifyError } from './utils/errors'
import { recordFault, recordRefusal } from './utils/errorJournal'
import type { ApiErrorBody } from '~~/shared/models/errors'

// Обработчик ошибок /api/** (ADR-0009).
//
// Почему свой, а не хук `error`: у ошибок с флагом unhandled (любой неожиданный
// throw из глубины — именно то, что мы называем сбоем) Nitro затирает message
// в "Server Error" и обнуляет data. То есть error_id штатным путём до клиента
// не доехал бы, и пользователю нечего было бы назвать в обращении.
//
// Обрабатываются только /api/**; всё остальное отдаётся дальше по цепочке
// обработчиков Nuxt — там рендер страницы ошибки и редирект на baseURL.

// h3 кеширует распарсенное тело здесь. Читаем именно кеш: повторное чтение
// потока в обработчике ошибок недопустимо — он уже потреблён хендлером.
const PARSED_BODY = Symbol.for('h3ParsedBody')

function cachedBody(event: H3Event): unknown {
  try {
    return (event.node.req as unknown as Record<symbol, unknown>)[PARSED_BODY]
  } catch {
    return undefined
  }
}

interface PortalContext {
  portal?: { id?: number }
  user_id?: number
}

export default function billingErrorHandler(error: Error & { statusCode?: number }, event: H3Event) {
  if (event.handled) return
  if (!event.path?.startsWith('/api')) return // не наш случай — дальше по цепочке

  const { kind, code, statusCode, details, message } = classifyError(error)
  const ctx = event.context.portal as PortalContext | undefined
  const portal_id = ctx?.portal?.id
  const user_id = ctx?.user_id

  let error_id: string | undefined
  if (kind === 'fault') {
    error_id = recordFault(error, code, statusCode, {
      source: 'api',
      portal_id,
      user_id,
      request: {
        method: event.method,
        url: event.path,
        headers: getRequestHeaders(event),
        body: cachedBody(event)
      }
    }, details)
  } else {
    recordRefusal(code, statusCode, message, {
      source: 'api',
      portal_id,
      user_id,
      method: event.method,
      url: event.path
    })
  }

  const body: ApiErrorBody = {
    error: true,
    statusCode,
    kind,
    code,
    // При сбое наружу не уходит ничего о внутренностях: ни message, ни стектрейс,
    // ни куски SQL с данными другого портала. Всё это остаётся в журнале.
    message: kind === 'fault' ? 'Внутренняя ошибка сервера' : message,
    details: kind === 'fault' ? undefined : details,
    error_id,
    ts: new Date().toISOString()
  }

  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'content-type', 'application/json')
  setResponseHeader(event, 'cache-control', 'no-cache')
  return send(event, JSON.stringify(body))
}
