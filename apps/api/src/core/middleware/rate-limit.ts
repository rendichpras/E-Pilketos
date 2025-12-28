import type { MiddlewareHandler } from "hono";
import { env } from "../../env";
import { isIP } from "node:net";
import { getRedisClient, hasRedis } from "../../utils/redis";
import { logger } from "../logger";

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

function stripPort(ip: string) {
  const s = ip.trim();

  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end > 1) return s.slice(1, end);
  }

  const first = s.indexOf(":");
  const last = s.lastIndexOf(":");
  if (first > 0 && first === last) return s.slice(0, last);

  return s;
}

function normalizeIp(ip: string) {
  let s = stripPort(ip);
  if (s.startsWith("::ffff:")) s = s.slice("::ffff:".length);
  return s;
}

function getSocketIp(c: HonoCtx): string | undefined {
  const r = c.req.raw as any;
  const nodeReq = r?.raw ?? r?.req ?? r?.incoming ?? r;
  const addr = nodeReq?.socket?.remoteAddress ?? nodeReq?.connection?.remoteAddress;
  if (typeof addr !== "string") return undefined;
  const ip = normalizeIp(addr);
  return isIP(ip) ? ip : undefined;
}

function getTrustedHeaderIp(c: HonoCtx): string | undefined {
  const candidates = [
    c.req.header("cf-connecting-ip"),
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim(),
    c.req.header("x-real-ip"),
    c.req.header("x-client-ip")
  ].filter(Boolean) as string[];

  for (const cand of candidates) {
    const ip = normalizeIp(cand);
    if (isIP(ip)) return ip;
  }
  return undefined;
}

export function getClientIp(c: HonoCtx): string {
  if (env.TRUST_PROXY_HEADERS) {
    return getTrustedHeaderIp(c) ?? getSocketIp(c) ?? "unknown";
  }
  return getSocketIp(c) ?? "unknown";
}

const memoryStore = new Map<string, Bucket>();

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;
const MAX_MEMORY_KEYS = 50_000;

function sweepMemoryStore(t: number) {
  if (t - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = t;

  for (const [k, b] of memoryStore) {
    if (b.resetAt <= t) memoryStore.delete(k);
  }

  if (memoryStore.size > MAX_MEMORY_KEYS) {
    const toDrop = memoryStore.size - MAX_MEMORY_KEYS;
    let dropped = 0;
    for (const k of memoryStore.keys()) {
      memoryStore.delete(k);
      dropped += 1;
      if (dropped >= toDrop) break;
    }
  }
}

export interface RateLimitOptions {
  id: (c: HonoCtx) => string;
  windowSec: number;
  max: number;
  prefix: string;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const windowMs = Math.max(1, opts.windowSec) * 1000;
  const max = Math.max(1, opts.max);

  return async (c, next) => {
    const id = opts.id(c);
    const key = keyFor(opts.prefix, id);

    const setRateLimitHeaders = (remaining: number, resetAt: number) => {
      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(remaining));
      c.header("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));
    };

    const rateLimitExceeded = () => {
      return c.json(
        {
          ok: false,
          error: "Terlalu banyak permintaan. Coba lagi nanti.",
          code: "TOO_MANY_REQUESTS",
          requestId: c.get("requestId")
        },
        429
      );
    };

    if (hasRedis()) {
      try {
        const redis = await getRedisClient();

        if (redis) {
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

          setRateLimitHeaders(remaining, resetAt);

          if (!allowed) {
            return rateLimitExceeded();
          }

          await next();
          return;
        }
      } catch (e) {
        logger.error({ err: e }, "RateLimit Redis failed, falling back to memory");
      }
    }

    const t = nowMs();
    sweepMemoryStore(t);
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= t) {
      const resetAt = t + windowMs;
      memoryStore.set(key, { resetAt, count: 1 });

      setRateLimitHeaders(max - 1, resetAt);
      await next();
      return;
    }

    existing.count += 1;
    memoryStore.set(key, existing);

    const allowed = existing.count <= max;
    const remaining = Math.max(0, max - existing.count);

    setRateLimitHeaders(remaining, existing.resetAt);

    if (!allowed) {
      return rateLimitExceeded();
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
} as const;
