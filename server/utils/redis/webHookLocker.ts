import { redisClient } from "~~/server/services/redis"

/**
 * Семафор активных операций по контракту, основанный на Redis-счётчике.
 *
 * Зачем нужен:
 *   Когда наш сервер модифицирует productRow / catalog.product.offer в B24,
 *   B24 присылает webhook CRM_DYNAMIC_ITEM_UPDATE на контракт. Webhook-handler
 *   делает reconciliation (читает все productRow из B24 и переписывает в нашу
 *   БД). Если он сработает в момент, когда наши изменения ещё не доехали —
 *   получим рассинхрон. Поэтому webhook пропускается, пока хоть одна наша
 *   операция активна на этом контракте.
 *
 * Почему счётчик, а не mutex:
 *   Несколько параллельных запросов на один контракт (например, перенос 5
 *   модулей) не должны блокировать друг друга — они работают с разными
 *   productRow и не пересекаются. Им нужно лишь скоординированно «держать»
 *   webhook-фильтр, пока хоть один из них в работе.
 *
 *   acquireLock делает INCR — увеличивает счётчик активных операций.
 *   releaseLock делает DECR; при достижении 0 ключ удаляется.
 *   Webhook видит наличие ключа в Redis (любое значение) → пропускает.
 */

const LOCK_TTL = 30 // seconds, защита от утечки при падении процесса
const RELEASE_GRACE_MS = 2000 // отложенное снятие лока — ловим поздние webhook'и B24 (доставляются через 0.5–2 сек после API-вызова)

const RELEASE_LUA = `
local count = redis.call('DECR', KEYS[1])
if count <= 0 then
    redis.call('DEL', KEYS[1])
end
return count
`

function lockKey(contractId: number, portalId: number): string {
    return `lock:contract:${contractId}_${portalId}`
}

export async function acquireLock(contractId: number, portalId: number): Promise<void> {
    const key = lockKey(contractId, portalId)
    await redisClient.incr(key)
    // Освежаем TTL на каждый acquire — пока идут запросы в burst, ключ не успевает истечь.
    await redisClient.expire(key, LOCK_TTL)
}

export async function releaseLock(contractId: number, portalId: number): Promise<void> {
    const key = lockKey(contractId, portalId)
    // Откладываем фактический DECR на RELEASE_GRACE_MS, чтобы поздние webhook'и B24
    // (которые B24 доставляет с задержкой ~0.5–2 сек после нашего API-вызова) ещё застали лок
    // и были скипнуты. Семафор-счётчик корректно работает с параллельными отложенными DECR'ами:
    // ключ удаляется только когда счётчик дошёл до нуля.
    setTimeout(() => {
        redisClient.eval(RELEASE_LUA, 1, key).catch(err => {
            console.error(`[releaseLock] failed to release ${key}:`, err)
        })
    }, RELEASE_GRACE_MS)
}
