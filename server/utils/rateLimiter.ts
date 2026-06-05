/**
 * Token-bucket rate limiter.
 *
 * Bitrix24 ограничивает приложения по схеме leaky-bucket: за секунду в среднем
 * можно ~2 запроса, при этом «ведро» вмещает burst ~50. Запросы сверх лимита
 * получают HTTP 200 OK c { error: "QUERY_LIMIT_EXCEEDED" } в теле, что в
 * нашем axios-интерсепторе не отлавливается и проявляется как тихая потеря
 * запроса.
 *
 * Этот лимитер превентивно держит исходящий поток в безопасной зоне:
 * параллельные запросы выстраиваются в очередь и выпускаются с заданной
 * скоростью.
 */

class TokenBucket {
    private tokens: number;
    private lastRefill: number;
    private readonly waiters: Array<() => void> = [];
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private readonly capacity: number,
        private readonly refillRate: number, // tokens per second
    ) {
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    private refill() {
        const now = Date.now();
        const elapsedMs = now - this.lastRefill;
        if (elapsedMs <= 0) return;
        const newTokens = (elapsedMs / 1000) * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + newTokens);
        this.lastRefill = now;
    }

    private drain() {
        this.refill();
        while (this.waiters.length > 0 && this.tokens >= 1) {
            this.tokens -= 1;
            const w = this.waiters.shift()!;
            w();
        }
        if (this.waiters.length > 0 && this.timer === null) {
            const tokensNeeded = 1 - this.tokens;
            const waitMs = Math.max(10, Math.ceil((tokensNeeded / this.refillRate) * 1000));
            this.timer = setTimeout(() => {
                this.timer = null;
                this.drain();
            }, waitMs);
        }
    }

    async acquire(): Promise<void> {
        if (this.waiters.length === 0) {
            this.refill();
            if (this.tokens >= 1) {
                this.tokens -= 1;
                return;
            }
        }
        return new Promise<void>((resolve) => {
            this.waiters.push(resolve);
            this.drain();
        });
    }
}

class PerKeyRateLimiter {
    private readonly buckets = new Map<string, TokenBucket>();

    constructor(
        private readonly capacity: number,
        private readonly refillRate: number,
    ) {}

    async acquire(key: string): Promise<void> {
        let bucket = this.buckets.get(key);
        if (!bucket) {
            bucket = new TokenBucket(this.capacity, this.refillRate);
            this.buckets.set(key, bucket);
        }
        return bucket.acquire();
    }
}

// Capacity 45 — burst запас (B24 leaky bucket ~50, оставляем место).
// Refill 1.5 req/sec — устойчивая скорость с запасом до номинальных 2.
export const b24RateLimiter = new PerKeyRateLimiter(45, 1.5);

/**
 * Извлечь хост из axios-конфига, чтобы использовать как ключ лимитера
 * (один портал = один host = один bucket).
 */
export function extractHost(config: { url?: string; baseURL?: string }): string {
    const url = config.url ?? "";
    const baseURL = config.baseURL ?? "";
    const full = url.startsWith("http") ? url : baseURL + url;
    try {
        return new URL(full).host;
    } catch {
        return baseURL || url || "unknown";
    }
}
