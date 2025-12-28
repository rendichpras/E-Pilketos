import type { Context, Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../../../app-env";
import { adminRepository } from "./auth.repository";
import { env } from "../../../env";
import { UnauthorizedError } from "../../../core/errors";
import { ERROR_CODES } from "@e-pilketos/types";

export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "admin_session");

  if (!sessionToken) {
    throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);
  }

  const row = await adminRepository.findValidSession(sessionToken);

  if (!row) {
    await adminRepository.deleteSession(sessionToken);
    deleteCookie(c, "admin_session", { path: "/", domain: env.COOKIE_DOMAIN });

    throw new UnauthorizedError(
      "Sesi tidak valid atau sudah kadaluarsa",
      ERROR_CODES.SESSION_EXPIRED
    );
  }

  c.set("admin", { adminId: row.admin.id, role: row.admin.role });
  return next();
}
