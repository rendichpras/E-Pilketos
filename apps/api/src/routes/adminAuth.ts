import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { admins, adminSessions } from "../db/schema";
import type { AppEnv } from "../app-env";
import { adminAuth } from "../middlewares/adminAuth";
import { env as appEnv } from "../env";
import { rateLimit, getClientIp, rateLimitConfig } from "../middlewares/rateLimit";
import { addSeconds, createSessionToken } from "../utils/session";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const adminAuthApp = new Hono<AppEnv>();

adminAuthApp.post(
  "/login",
  rateLimit({
    windowSec: appEnv.RATE_LIMIT_LOGIN_WINDOW_SEC,
    max: appEnv.RATE_LIMIT_LOGIN_MAX,
    prefix: rateLimitConfig.adminLogin.prefix,
    id: (c) => getClientIp(c)
  }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
      return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

    const { username, password } = parsed.data;

    const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
    if (!admin) return c.json({ error: "Invalid username or password" }, 401);

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return c.json({ error: "Invalid username or password" }, 401);

    const now = new Date();
    const expiresAt = addSeconds(now, appEnv.ADMIN_SESSION_TTL_SEC);
    const sessionToken = createSessionToken();

    await db.insert(adminSessions).values({
      adminId: admin.id,
      sessionToken,
      expiresAt
    });

    setCookie(c, "admin_session", sessionToken, {
      httpOnly: true,
      secure: appEnv.COOKIE_SECURE ?? appEnv.NODE_ENV === "production",
      sameSite: appEnv.COOKIE_SAMESITE,
      domain: appEnv.COOKIE_DOMAIN,
      path: "/",
      maxAge: appEnv.ADMIN_SESSION_TTL_SEC
    });

    return c.json({ id: admin.id, username: admin.username, role: admin.role });
  }
);

adminAuthApp.post("/logout", async (c) => {
  const sessionToken = getCookie(c, "admin_session");
  if (sessionToken) {
    await db.delete(adminSessions).where(eq(adminSessions.sessionToken, sessionToken));
  }
  deleteCookie(c, "admin_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
  return c.json({ success: true });
});

adminAuthApp.get("/me", adminAuth, async (c) => {
  const adminPayload = c.get("admin");
  if (!adminPayload) return c.json({ error: "Unauthorized" }, 401);

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminPayload.adminId))
    .limit(1);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  return c.json({ id: admin.id, username: admin.username, role: admin.role });
});
