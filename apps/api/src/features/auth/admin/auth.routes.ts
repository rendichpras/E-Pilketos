import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../../../app-env";
import { adminAuth } from "./auth.middleware";
import { adminAuthService } from "./auth.service";
import { env } from "../../../env";
import { rateLimit, getClientIp, rateLimitConfig } from "../../../core/middleware";
import { success } from "../../../core/response";
import { UnauthorizedError } from "../../../core/errors";
import { validateBody } from "../../../core/validation";
import { adminLoginSchema } from "@e-pilketos/validators";
import { ERROR_CODES } from "@e-pilketos/types";

export const adminAuthApp = new Hono<AppEnv>();

adminAuthApp.post(
  "/login",
  rateLimit({
    windowSec: env.RATE_LIMIT_LOGIN_WINDOW_SEC,
    max: env.RATE_LIMIT_LOGIN_MAX,
    prefix: rateLimitConfig.adminLogin.prefix,
    id: (c) => getClientIp(c)
  }),
  async (c) => {
    const { username, password } = await validateBody(c, adminLoginSchema);

    const { admin, sessionToken, expiresAt: _expiresAt } = await adminAuthService.login(username, password);

    setCookie(c, "admin_session", sessionToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
      sameSite: env.COOKIE_SAMESITE,
      domain: env.COOKIE_DOMAIN,
      path: "/",
      maxAge: env.ADMIN_SESSION_TTL_SEC
    });

    return success(c, admin);
  }
);

adminAuthApp.post("/logout", async (c) => {
  const sessionToken = getCookie(c, "admin_session");

  if (sessionToken) {
    await adminAuthService.logout(sessionToken);
  }

  deleteCookie(c, "admin_session", { path: "/", domain: env.COOKIE_DOMAIN });

  return success(c, { success: true });
});

adminAuthApp.get("/me", adminAuth, async (c) => {
  const adminPayload = c.get("admin");
  if (!adminPayload) {
    throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);
  }

  const admin = await adminAuthService.getMe(adminPayload.adminId);

  return success(c, admin);
});
