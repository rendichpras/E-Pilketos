import type { Context, Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../../../app-env";
import { adminRepository } from "./auth.repository";
import { env } from "../../../env";

export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "admin_session");

  if (!sessionToken) {
    return c.json({ ok: false, error: "Tidak terautentikasi", code: "UNAUTHORIZED" }, 401);
  }

  const row = await adminRepository.findValidSession(sessionToken);

  if (!row) {
    await adminRepository.deleteSession(sessionToken);
    deleteCookie(c, "admin_session", { path: "/", domain: env.COOKIE_DOMAIN });

    return c.json(
      {
        ok: false,
        error: "Sesi tidak valid atau sudah kadaluarsa",
        code: "SESSION_EXPIRED"
      },
      401
    );
  }

  c.set("admin", { adminId: row.admin.id, role: row.admin.role });
  return next();
}
