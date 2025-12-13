import type { MiddlewareHandler } from "hono";
import { env } from "../env";
import { getRedis, redisEnabled } from "../utils/redis";

type Bucket = {
  resetAt: number;
  count: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  key: (c: any) => string;
  message?: string;
};

const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  if (buckets.size < 20_000) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export function getClientIp(c: any): string {
  const xfwd = c.req.header("x-forwarded-for") ?? "";
  if (xfwd) {
    const first = xfwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const xreal = c.req.header("x-real-ip")?.trim();
  if (xreal) return xreal;
  return "";
}

const LUA_INCR_EXPIRE = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`;

async function rateLimitRedis(
  fullKey: string,
  windowMs: number
): Promise<{ count: number; ttlMs: number }> {
  const r = await getRedis();
  const res = (await r.eval(LUA_INCR_EXPIRE, {
    keys: [fullKey],
    arguments: [String(windowMs)]
  })) as unknown;

  const arr = Array.isArray(res) ? res : null;
  const count = arr?.[0] != null ? Number(arr[0]) : 1;
  const ttlMs = arr?.[1] != null ? Number(arr[1]) : windowMs;

  return { count, ttlMs };
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max, key, message } = opts;

  return async (c, next) => {
    const now = Date.now();
    const k = key(c);

    if (redisEnabled()) {
      try {
        const fullKey = `${env.RATE_LIMIT_REDIS_PREFIX}:${k}`;
        const { count, ttlMs } = await rateLimitRedis(fullKey, windowMs);

        if (count > max) {
          const retryAfterSec = Math.max(1, Math.ceil(ttlMs / 1000));
          c.header("Retry-After", String(retryAfterSec));
          return c.json({ error: message ?? "Terlalu banyak percobaan. Coba lagi nanti." }, 429);
        }

        await next();
        return;
      } catch (e) {
        console.error("Redis rate limit fallback:", e);
      }
    }

    // fallback in-memory
    cleanup(now);

    const b = buckets.get(k);
    if (!b || b.resetAt <= now) {
      buckets.set(k, { resetAt: now + windowMs, count: 1 });
      await next();
      return;
    }

    b.count += 1;
    if (b.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
      c.header("Retry-After", String(retryAfterSec));
      return c.json({ error: message ?? "Terlalu banyak percobaan. Coba lagi nanti." }, 429);
    }

    buckets.set(k, b);
    await next();
  };
}
