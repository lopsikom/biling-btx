import { redisClient } from "~~/server/services/redis"

const LOCK_TTL = 10 

export async function acquireLock(contractId: number, portalId: number): Promise<boolean> {
    const key = `lock:contract:${contractId}_${portalId}`
    const result = await redisClient.set(key, "1", "EX", LOCK_TTL, "NX")
    return result === "OK"
}

export async function releaseLock(contractId: number, portalId: number): Promise<void> {
    setTimeout(async () => {
        await redisClient.del(`lock:contract:${contractId}_${portalId}`)
    }, 1500)
}