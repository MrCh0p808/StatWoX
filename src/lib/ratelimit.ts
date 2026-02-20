import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory rate limiter fallback with bounded memory
const memoryCache = new Map<string, number[]>();
const MAX_CACHE_ENTRIES = 10000;
const WINDOW_MS = 10000; // 10s
const MAX_REQUESTS = 5;

function pruneCache(): void {
    if (memoryCache.size > MAX_CACHE_ENTRIES) {
        // Delete oldest entries (FIFO)
        const keysToDelete = Array.from(memoryCache.keys()).slice(
            0,
            memoryCache.size - MAX_CACHE_ENTRIES
        );
        for (const key of keysToDelete) {
            memoryCache.delete(key);
        }
    }
}

export const ratelimit = process.env.UPSTASH_REDIS_REST_URL
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '10 s'),
        analytics: true,
    })
    : {
        limit: async (identifier: string) => {
            const now = Date.now();
            const windowStart = now - WINDOW_MS;
            const timestamps: number[] = memoryCache.get(identifier) || [];
            const inWindow = timestamps.filter((t: number) => t > windowStart);

            if (inWindow.length >= MAX_REQUESTS) {
                // Update with pruned timestamps
                memoryCache.set(identifier, inWindow);
                return { success: false, limit: MAX_REQUESTS, remaining: 0, reset: windowStart + WINDOW_MS };
            }

            inWindow.push(now);
            memoryCache.set(identifier, inWindow);
            pruneCache();

            return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - inWindow.length, reset: windowStart + WINDOW_MS };
        }
    };

