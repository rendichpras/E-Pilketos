import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { getRedis, redisEnabled } from "../utils/redis";

export const healthApp = new Hono<AppEnv>();

healthApp.get("/", (c) =>
  c.json({
    status: "ok"
  })
);

healthApp.get("/ready", async (c) => {
  const now = new Date();

  let dbOk = false;
  let redisOk = false;

  try {
    await db.execute(sql`select 1 as ok`);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  if (redisEnabled()) {
    try {
      const r = await getRedis();
      const pong = await r.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }
  } else {
    redisOk = true;
  }

  const ok = dbOk && redisOk;

  return c.json(
    {
      status: ok ? "ready" : "not_ready",
      time: now.toISOString(),
      checks: {
        db: dbOk,
        redis: redisOk
      }
    },
    ok ? 200 : 503
  );
});
