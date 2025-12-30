import { and, eq, gt } from "drizzle-orm";
import { db } from "../../../db/client";
import { admins, adminSessions } from "../../../db/schema";
import { hashSessionToken } from "../../../utils/session";

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
    const hashed = hashSessionToken(sessionToken);
    await db.insert(adminSessions).values({
      adminId,
      sessionToken: hashed,
      expiresAt
    });
  },

  async deleteSession(sessionToken: string) {
    const hashed = hashSessionToken(sessionToken);
    await db.delete(adminSessions).where(eq(adminSessions.sessionToken, hashed));
  },

  async findValidSession(sessionToken: string) {
    const now = new Date();
    const hashed = hashSessionToken(sessionToken);
    const [row] = await db
      .select({
        session: adminSessions,
        admin: admins
      })
      .from(adminSessions)
      .innerJoin(admins, eq(adminSessions.adminId, admins.id))
      .where(and(eq(adminSessions.sessionToken, hashed), gt(adminSessions.expiresAt, now)))
      .limit(1);
    return row ?? null;
  }
};
