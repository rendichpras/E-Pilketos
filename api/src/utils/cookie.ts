import { env } from "../env";
import type { CookieOptions } from "hono/utils/cookie";

export const COOKIE_NAMES = {
  ADMIN_SESSION: "admin_session",
  VOTER_SESSION: "voter_session"
} as const;

export function getSessionCookieOptions(type: "admin" | "voter"): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: "/",
    maxAge: type === "admin" ? env.ADMIN_SESSION_TTL_SEC : env.VOTER_SESSION_TTL_SEC
  };
}

export function getDeleteCookieOptions(): Pick<CookieOptions, "path" | "domain"> {
  return {
    path: "/",
    domain: env.COOKIE_DOMAIN
  };
}
