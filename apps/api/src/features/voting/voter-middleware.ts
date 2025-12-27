import type { Context, Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { voterSessions, tokens } from "../../db/schema";
import { env as appEnv } from "../../env";

export async function voterAuth(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, "voter_session");

  if (!sessionToken) {
    return c.json({ ok: false, error: "Tidak terautentikasi", code: "UNAUTHORIZED" }, 401);
  }

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
    deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
    return c.json(
      {
        ok: false,
        error: "Sesi tidak valid atau sudah kadaluarsa",
        code: "SESSION_EXPIRED"
      },
      401
    );
  }

  if (row.token.status !== "UNUSED") {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));
    deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
    return c.json(
      {
        ok: false,
        error: "Token sudah digunakan",
        code: "TOKEN_USED"
      },
      409
    );
  }

  c.set("voter", {
    sessionToken,
    tokenId: row.session.tokenId,
    electionId: row.session.electionId
  });

  return next();
}
