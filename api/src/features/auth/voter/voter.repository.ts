import { and, eq, gt } from "drizzle-orm";
import { db } from "../../../db/client";
import { elections, tokens, voterSessions } from "../../../db/schema";
import { hashSessionToken } from "../../../utils/session";

export const voterRepository = {
  async findTokenWithElection(normalizedToken: string) {
    return db
      .select({ token: tokens, election: elections })
      .from(tokens)
      .innerJoin(elections, eq(tokens.electionId, elections.id))
      .where(eq(tokens.token, normalizedToken))
      .limit(10);
  },

  async createSession(data: {
    tokenId: string;
    electionId: string;
    sessionToken: string;
    expiresAt: Date;
  }) {
    const hashed = hashSessionToken(data.sessionToken);
    await db.transaction(async (tx) => {
      await tx.delete(voterSessions).where(eq(voterSessions.tokenId, data.tokenId));
      await tx.insert(voterSessions).values({
        ...data,
        sessionToken: hashed
      });
    });
  },

  async deleteSession(sessionToken: string) {
    const hashed = hashSessionToken(sessionToken);
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, hashed));
  },

  async findValidSession(sessionToken: string) {
    const now = new Date();
    const hashed = hashSessionToken(sessionToken);
    const [row] = await db
      .select({
        session: voterSessions,
        election: elections
      })
      .from(voterSessions)
      .innerJoin(elections, eq(voterSessions.electionId, elections.id))
      .where(and(eq(voterSessions.sessionToken, hashed), gt(voterSessions.expiresAt, now)))
      .limit(1);
    return row ?? null;
  },

  async findSessionByTokenId(tokenId: string) {
    const [row] = await db
      .select()
      .from(voterSessions)
      .where(eq(voterSessions.tokenId, tokenId))
      .limit(1);
    return row ?? null;
  }
};
