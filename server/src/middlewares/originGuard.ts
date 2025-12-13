import type { MiddlewareHandler } from "hono";

type Options = {
  allowedOrigins: string[];
};

function normalizeOrigin(o: string) {
  return o.trim().replace(/\/+$/, "");
}

export function originGuard(opts: Options): MiddlewareHandler {
  const allowed = new Set(opts.allowedOrigins.map(normalizeOrigin));

  return async (c, next) => {
    const method = c.req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next();
    }

    const cookie = c.req.header("cookie") ?? "";
    if (!cookie) {
      return next();
    }

    const origin = c.req.header("origin") ?? "";
    if (!origin) {
      return c.json({ error: "Origin header missing" }, 403);
    }

    if (!allowed.has(normalizeOrigin(origin))) {
      return c.json({ error: "Origin not allowed" }, 403);
    }

    return next();
  };
}
