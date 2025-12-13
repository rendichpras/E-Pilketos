import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env";

type Role = "SUPER_ADMIN" | "COMMITTEE";

export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const admin = c.get("admin");
    if (!admin) return c.json({ error: "Unauthorized" }, 401);
    if (!roles.includes(admin.role)) return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
