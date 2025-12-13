import { createClient, type RedisClientType } from "redis";
import { env } from "../env";

let client: RedisClientType | null = null;
let connectPromise: Promise<void> | null = null;

export function redisEnabled(): boolean {
  return !!(env.REDIS_URL && env.REDIS_URL.trim().length > 0);
}

export async function getRedis(): Promise<RedisClientType> {
  if (!redisEnabled()) {
    throw new Error("REDIS_URL not set");
  }

  if (!client) {
    client = createClient({ url: env.REDIS_URL });
    client.on("error", (err) => {
      console.error("Redis error:", err);
    });
    connectPromise = client.connect();
  }

  if (connectPromise) {
    await connectPromise;
  }

  return client!;
}
