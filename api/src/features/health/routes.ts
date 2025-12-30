import { Hono } from "hono";
import { hasRedis, getRedisClient } from "../../utils/redis";
import type { AppEnv } from "../../app-env";
import { success } from "../../core/response";
import { db } from "../../db/client";
import { sql } from "drizzle-orm";

export const healthApp = new Hono<AppEnv>();

healthApp.get("/", (c) => {
  return success(c, {
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

healthApp.get("/ready", async (c) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let overall = true;

  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart
    };
  } catch (err) {
    overall = false;
    checks.database = {
      status: "unhealthy",
      latency: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }

  if (hasRedis()) {
    const redisStart = Date.now();
    try {
      const client = await getRedisClient();
      if (!client) throw new Error("Failed to get client");
      await client.ping();
      checks.redis = {
        status: "healthy",
        latency: Date.now() - redisStart
      };
    } catch (err) {
      overall = false;
      checks.redis = {
        status: "unhealthy",
        latency: Date.now() - redisStart,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }

  const status = overall ? 200 : 503;

  return c.json(
    {
      ok: overall,
      data: {
        status: overall ? "ready" : "not_ready",
        timestamp: new Date().toISOString(),
        checks
      }
    },
    status
  );
});

healthApp.get("/live", (c) => {
  return success(c, {
    status: "alive",
    timestamp: new Date().toISOString()
  });
});
