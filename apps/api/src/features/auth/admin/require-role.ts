import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../../app-env";
import type { AdminRole } from "@e-pilketos/types";

export function requireRole(...roles: AdminRole[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const admin = c.get("admin");

    if (!admin) {
      return c.json({ ok: false, error: "Tidak terautentikasi", code: "UNAUTHORIZED" }, 401);
    }

    if (!roles.includes(admin.role)) {
      return c.json({ ok: false, error: "Akses ditolak", code: "FORBIDDEN" }, 403);
    }

    await next();
  };
}
