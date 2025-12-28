import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../../../app-env";
import { voterAuthService } from "./voter.service";
import { env } from "../../../env";
import { rateLimit, getClientIp, rateLimitConfig } from "../../../core/middleware";
import { success } from "../../../core/response";
import { validateBody } from "../../../core/validation";
import { voterLoginSchema } from "@e-pilketos/validators";

export const voterAuthApp = new Hono<AppEnv>();

voterAuthApp.post(
  "/token-login",
  rateLimit({
    windowSec: env.RATE_LIMIT_TOKEN_LOGIN_WINDOW_SEC,
    max: env.RATE_LIMIT_TOKEN_LOGIN_MAX,
    prefix: rateLimitConfig.voterTokenLogin.prefix,
    id: (c) => getClientIp(c)
  }),
  async (c) => {
    const { token } = await validateBody(c, voterLoginSchema);

    const result = await voterAuthService.login(token);

    setCookie(c, "voter_session", result.sessionToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
      sameSite: env.COOKIE_SAMESITE,
      domain: env.COOKIE_DOMAIN,
      path: "/",
      maxAge: env.VOTER_SESSION_TTL_SEC
    });

    return success(c, {
      electionId: result.electionId,
      electionSlug: result.electionSlug,
      electionName: result.electionName
    });
  }
);

voterAuthApp.post("/token-logout", async (c) => {
  const sessionToken = getCookie(c, "voter_session");

  if (sessionToken) {
    await voterAuthService.logout(sessionToken);
  }

  deleteCookie(c, "voter_session", { path: "/", domain: env.COOKIE_DOMAIN });

  return success(c, { success: true });
});
