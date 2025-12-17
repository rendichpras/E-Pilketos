import type { MiddlewareHandler } from "hono";
import { env } from "../env";
import { getRedisClient, hasRedis } from "../utils/redis";

type HonoCtx = Parameters<MiddlewareHandler>[0];

type Bucket = {
  resetAt: number;
  count: number;
};

function nowMs() {
  return Date.now();
}

function keyFor(prefix: string, id: string) {
  return `${prefix}:${id}`;
}

export function getClientIp(c: HonoCtx): string {
  const cf = c.req.header("cf-connecting-ip");
  if (cf) return cf.trim();

  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();

  const real = c.req.header("x-real-ip");
  if (real) return real.trim();

  const client = c.req.header("x-client-ip");
  if (client) return client.trim();

  return "unknown";
}

const memoryStore = new Map<string, Bucket>();

export function rateLimit(opts: {
  id: (c: HonoCtx) => string;
  windowSec: number;
  max: number;
  prefix: string;
}): MiddlewareHandler {
  const windowMs = Math.max(1, opts.windowSec) * 1000;
  const max = Math.max(1, opts.max);

  return async (c, next) => {
    const id = opts.id(c);
    const key = keyFor(opts.prefix, id);

    if (hasRedis()) {
      const redis = await getRedisClient();

      if (!redis) {
        await next();
        return;
      }

      const t = nowMs();
      const ttlSec = Math.ceil(windowMs / 1000);

      const script = `
        local current = redis.call("INCR", KEYS[1])
        if current == 1 then
          redis.call("EXPIRE", KEYS[1], ARGV[1])
        end
        local ttl = redis.call("TTL", KEYS[1])
        return {current, ttl}
      `;

      const res = (await redis.eval(script, {
        keys: [key],
        arguments: [String(ttlSec)]
      })) as unknown as [number, number];

      const current = Number(res?.[0] ?? 0);
      const ttl = Number(res?.[1] ?? ttlSec);

      const allowed = current <= max;
      const resetAt = t + ttl * 1000;
      const remaining = Math.max(0, max - current);

      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(remaining));
      c.header("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));

      if (!allowed) {
        return c.json(
          {
            error: "Terlalu banyak permintaan. Coba lagi nanti.",
            requestId: c.get("requestId")
          },
          429
        );
      }

      await next();
      return;
    }

    const t = nowMs();
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= t) {
      const resetAt = t + windowMs;
      memoryStore.set(key, { resetAt, count: 1 });

      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(max - 1));
      c.header("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));

      await next();
      return;
    }

    existing.count += 1;
    memoryStore.set(key, existing);

    const allowed = existing.count <= max;
    const remaining = Math.max(0, max - existing.count);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.floor(existing.resetAt / 1000)));

    if (!allowed) {
      return c.json(
        {
          error: "Terlalu banyak permintaan. Coba lagi nanti.",
          requestId: c.get("requestId")
        },
        429
      );
    }

    await next();
  };
}

export const rateLimitConfig = {
  adminLogin: {
    windowSec: env.RATE_LIMIT_LOGIN_WINDOW_SEC,
    max: env.RATE_LIMIT_LOGIN_MAX,
    prefix: env.RATE_LIMIT_REDIS_PREFIX
      ? `${env.RATE_LIMIT_REDIS_PREFIX}:admin-login`
      : "rl:admin-login"
  },
  voterTokenLogin: {
    windowSec: env.RATE_LIMIT_TOKEN_LOGIN_WINDOW_SEC,
    max: env.RATE_LIMIT_TOKEN_LOGIN_MAX,
    prefix: env.RATE_LIMIT_REDIS_PREFIX
      ? `${env.RATE_LIMIT_REDIS_PREFIX}:token-login`
      : "rl:token-login"
  },
  vote: {
    windowSec: env.RATE_LIMIT_VOTE_WINDOW_SEC,
    max: env.RATE_LIMIT_VOTE_MAX,
    prefix: env.RATE_LIMIT_REDIS_PREFIX ? `${env.RATE_LIMIT_REDIS_PREFIX}:vote` : "rl:vote"
  }
};
