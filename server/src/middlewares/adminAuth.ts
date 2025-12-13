import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyAdminJwt } from "../utils/jwt";
import type { AppEnv } from "../app-env";

export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, "admin_session");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verifyAdminJwt(token);
    c.set("admin", payload);
    return next();
  } catch {
    return c.json({ error: "Invalid or expired admin session" }, 401);
  }
}
