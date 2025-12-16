import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { adminSessions, admins } from "../db/schema";

export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "admin_session");
  if (!sessionToken) return c.json({ error: "Unauthorized" }, 401);

  const now = new Date();

  const [row] = await db
    .select({
      session: adminSessions,
      admin: admins
    })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(and(eq(adminSessions.sessionToken, sessionToken), gt(adminSessions.expiresAt, now)))
    .limit(1);

  if (!row) {
    await db.delete(adminSessions).where(eq(adminSessions.sessionToken, sessionToken));
    return c.json({ error: "Invalid or expired admin session" }, 401);
  }

  c.set("admin", { adminId: row.admin.id, role: row.admin.role });
  return next();
}
