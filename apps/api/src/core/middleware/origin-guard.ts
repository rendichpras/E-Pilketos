import type { MiddlewareHandler } from "hono";

type OriginGuardOptions = {
  allowedOrigins: string[];
};

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

export function originGuard(opts: OriginGuardOptions): MiddlewareHandler {
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
      return c.json({ ok: false, error: "Origin header missing", code: "ORIGIN_MISSING" }, 403);
    }

    if (!allowed.has(normalizeOrigin(origin))) {
      return c.json({ ok: false, error: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" }, 403);
    }

    return next();
  };
}
