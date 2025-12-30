import type { MiddlewareHandler } from "hono";
import crypto from "crypto";

export const requestId: MiddlewareHandler = async (c, next) => {
  const id = crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
};
