import type { MiddlewareHandler } from "hono";
import { ERROR_CODES } from "@/shared/types";
import { ForbiddenError } from "../errors";

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
      throw new ForbiddenError("Origin header missing", ERROR_CODES.ORIGIN_MISSING);
    }

    if (!allowed.has(normalizeOrigin(origin))) {
      throw new ForbiddenError("Origin not allowed", ERROR_CODES.ORIGIN_NOT_ALLOWED);
    }

    return next();
  };
}
