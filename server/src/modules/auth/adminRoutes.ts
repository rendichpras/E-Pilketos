import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { setCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { admins } from "../../db/schema";
import { signAdminJwt } from "../../utils/jwt";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../../middlewares/adminAuth";
import { env as appEnv } from "../../env";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const adminAuthApp = new Hono<AppEnv>();

adminAuthApp.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid body",
        details: parsed.error.flatten()
      },
      400
    );
  }

  const { username, password } = parsed.data;

  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);

  if (!admin) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const jwt = signAdminJwt({
    adminId: admin.id,
    role: admin.role
  });

  setCookie(c, "admin_session", jwt, {
    httpOnly: true,
    secure: appEnv.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/"
  });

  return c.json({
    id: admin.id,
    username: admin.username,
    role: admin.role
  });
});

adminAuthApp.post("/logout", async (c) => {
  deleteCookie(c, "admin_session", { path: "/" });
  return c.json({ success: true });
});

adminAuthApp.get("/me", adminAuth, async (c) => {
  const adminPayload = c.get("admin");

  if (!adminPayload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminPayload.adminId))
    .limit(1);

  if (!admin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    id: admin.id,
    username: admin.username,
    role: admin.role
  });
});
