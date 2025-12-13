import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { voterSessions, tokens } from "../db/schema";

export async function voterAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "voter_session");
  if (!sessionToken) return c.json({ error: "Unauthorized" }, 401);

  const now = new Date();

  const [row] = await db
    .select({
      session: voterSessions,
      token: tokens
    })
    .from(voterSessions)
    .innerJoin(tokens, eq(voterSessions.tokenId, tokens.id))
    .where(and(eq(voterSessions.sessionToken, sessionToken), gt(voterSessions.expiresAt, now)))
    .limit(1);

  if (!row) {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));
    return c.json({ error: "Invalid or expired voter session" }, 401);
  }

  if (row.token.status !== "UNUSED") {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));
    return c.json({ error: "Token sudah digunakan atau tidak valid" }, 401);
  }

  c.set("voter", {
    sessionToken,
    tokenId: row.session.tokenId,
    electionId: row.session.electionId
  });

  return next();
}
