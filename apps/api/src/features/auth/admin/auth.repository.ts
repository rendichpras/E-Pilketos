import { and, eq, gt } from "drizzle-orm";
import { db } from "../../../db/client";
import { admins, adminSessions } from "../../../db/schema";

export const adminRepository = {
  async findByUsername(username: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
    return admin ?? null;
  },

  async findById(id: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    return admin ?? null;
  },

  async createSession(adminId: string, sessionToken: string, expiresAt: Date) {
    await db.insert(adminSessions).values({
      adminId,
      sessionToken,
      expiresAt
    });
  },

  async deleteSession(sessionToken: string) {
    await db.delete(adminSessions).where(eq(adminSessions.sessionToken, sessionToken));
  },

  async findValidSession(sessionToken: string) {
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
    return row ?? null;
  }
};
