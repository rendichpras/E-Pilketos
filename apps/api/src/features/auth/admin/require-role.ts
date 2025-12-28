import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../../app-env";
import { ERROR_CODES, type AdminRole } from "@e-pilketos/types";
import { ForbiddenError, UnauthorizedError } from "../../../core/errors";

export function requireRole(...roles: AdminRole[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const admin = c.get("admin");

    if (!admin) {
      throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);
    }

    if (!roles.includes(admin.role)) {
      throw new ForbiddenError("Akses ditolak", ERROR_CODES.FORBIDDEN);
    }

    await next();
  };
}
