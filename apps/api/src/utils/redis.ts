import { createClient, type RedisClientType } from "redis";

type RedisClient = RedisClientType;

const REDIS_URL = process.env.REDIS_URL;

let client: RedisClient | null = null;
let connectPromise: Promise<void> | null = null;

let lastConnectErrorAt = 0;
const CONNECT_COOLDOWN_MS = 10_000;

export function hasRedis(): boolean {
  return Boolean(REDIS_URL);
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;

  const now = Date.now();
  if (now - lastConnectErrorAt < CONNECT_COOLDOWN_MS) return null;

  if (!client) {
    client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 3_000,
        reconnectStrategy: (retries) => Math.min(retries * 200, 2_000)
      }
    });

    client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    connectPromise = client.connect().then(() => undefined);
  }

  if (connectPromise) {
    try {
      await connectPromise;
    } catch (err) {
      lastConnectErrorAt = Date.now();
      console.error("Redis connect failed:", err);

      try {
        void client?.disconnect();
      } catch {
        // Ignore disconnect errors
      }

      client = null;
      connectPromise = null;
      return null;
    }
  }

  return client;
}

export async function quitRedis(): Promise<void> {
  if (!client) return;

  try {
    await client.quit();
  } catch {
    try {
      void client.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  } finally {
    client = null;
    connectPromise = null;
  }
}
