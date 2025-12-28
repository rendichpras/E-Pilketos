import type { Context, Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { voterSessions, tokens } from "../../db/schema";
import { env as appEnv } from "../../env";
import { ERROR_CODES } from "@e-pilketos/types";
import { ConflictError, UnauthorizedError } from "../../core/errors";
import { hashSessionToken } from "../../core/security/session-token";

export async function voterAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "voter_session");

  if (!sessionToken) {
    throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);
  }

  const now = new Date();
  const sessionTokenHash = hashSessionToken(sessionToken);

  const [row] = await db
    .select({
      session: voterSessions,
      token: tokens
    })
    .from(voterSessions)
    .innerJoin(tokens, eq(voterSessions.tokenId, tokens.id))
    .where(and(eq(voterSessions.sessionToken, sessionTokenHash), gt(voterSessions.expiresAt, now)))
    .limit(1);

  if (!row) {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionTokenHash));
    deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
    throw new UnauthorizedError(
      "Sesi tidak valid atau sudah kadaluarsa",
      ERROR_CODES.SESSION_EXPIRED
    );
  }

  if (row.token.status !== "UNUSED") {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionTokenHash));
    deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
    throw new ConflictError("Token sudah digunakan", ERROR_CODES.TOKEN_USED);
  }

  c.set("voter", {
    sessionToken,
    tokenId: row.session.tokenId,
    electionId: row.session.electionId
  });

  return next();
}
