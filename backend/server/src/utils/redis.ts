import { createClient, type RedisClientType } from "redis";

type RedisClient = RedisClientType;

const REDIS_URL = process.env.REDIS_URL;

let client: RedisClient | null = null;
let connectPromise: Promise<void> | null = null;

export function hasRedis(): boolean {
  return Boolean(REDIS_URL);
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;

  if (!client) {
    client = createClient({ url: REDIS_URL });

    client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    connectPromise = client.connect().then(() => undefined);
  }

  if (connectPromise) {
    await connectPromise;
  }

  return client;
}

export async function quitRedis(): Promise<void> {
  if (!client) return;

  try {
    await client.quit();
  } catch {
    try {
      client.disconnect();
    } catch {
      // ignore
    }
  } finally {
    client = null;
    connectPromise = null;
  }
}
