import { Hono } from "hono";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { getRedisClient, hasRedis } from "../utils/redis";

export const healthApp = new Hono<AppEnv>();

healthApp.get("/health", (c) => {
  return c.json({ ok: true });
});

healthApp.get("/health/ready", async (c) => {
  try {
    await db.execute("select 1");
  } catch (e) {
    console.error("Health DB check failed:", e);
    return c.json({ ok: false, reason: "db" }, 503);
  }

  if (hasRedis()) {
    try {
      const redis = await getRedisClient();
      if (!redis) throw new Error("Redis not available");
      await redis.ping();
    } catch (e) {
      console.error("Health Redis check failed:", e);
      return c.json({ ok: false, reason: "redis" }, 503);
    }
  }

  return c.json({ ok: true });
});
