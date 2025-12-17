import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, tokens, voterSessions } from "../../db/schema";
import { env as appEnv } from "../../env";
import { rateLimit, getClientIp, rateLimitConfig } from "../../middlewares/rateLimit";
import { addSeconds, createSessionToken } from "../../utils/session";

const tokenLoginSchema = z.object({
  token: z.string().min(1)
});

function normalizeToken(input: string): string | null {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length !== 8) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
}

export const voterAuthApp = new Hono<AppEnv>();

voterAuthApp.post(
  "/token-login",
  rateLimit({
    windowSec: appEnv.RATE_LIMIT_TOKEN_LOGIN_WINDOW_SEC,
    max: appEnv.RATE_LIMIT_TOKEN_LOGIN_MAX,
    prefix: rateLimitConfig.voterTokenLogin.prefix,
    id: (c) => getClientIp(c)
  }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = tokenLoginSchema.safeParse(body);
    if (!parsed.success)
      return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

    const normalizedToken = normalizeToken(parsed.data.token);
    if (!normalizedToken) {
      return c.json({ error: "Token tidak valid", code: "TOKEN_INVALID" }, 401);
    }

    const now = new Date();

    const [row] = await db
      .select({ token: tokens, election: elections })
      .from(tokens)
      .innerJoin(elections, eq(tokens.electionId, elections.id))
      .where(eq(tokens.token, normalizedToken))
      .limit(1);

    if (!row) {
      return c.json({ error: "Token tidak valid", code: "TOKEN_INVALID" }, 401);
    }

    if (row.token.status !== "UNUSED") {
      return c.json({ error: "Token sudah digunakan", code: "TOKEN_USED" }, 409);
    }

    const electionActive =
      row.election.status === "ACTIVE" && row.election.startAt <= now && now <= row.election.endAt;

    if (!electionActive) {
      return c.json(
        { error: "Pemilihan tidak aktif atau di luar jadwal", code: "ELECTION_INACTIVE" },
        400
      );
    }

    const sessionToken = createSessionToken();
    const expiresAt = addSeconds(now, appEnv.VOTER_SESSION_TTL_SEC);

    await db.transaction(async (tx) => {
      await tx.delete(voterSessions).where(eq(voterSessions.tokenId, row.token.id));
      await tx.insert(voterSessions).values({
        tokenId: row.token.id,
        electionId: row.election.id,
        sessionToken,
        expiresAt
      });
    });

    setCookie(c, "voter_session", sessionToken, {
      httpOnly: true,
      secure: appEnv.COOKIE_SECURE ?? appEnv.NODE_ENV === "production",
      sameSite: appEnv.COOKIE_SAMESITE,
      domain: appEnv.COOKIE_DOMAIN,
      path: "/",
      maxAge: appEnv.VOTER_SESSION_TTL_SEC
    });

    return c.json({
      electionId: row.election.id,
      electionSlug: row.election.slug,
      electionName: row.election.name
    });
  }
);

voterAuthApp.post("/token-logout", async (c) => {
  const sessionToken = getCookie(c, "voter_session");
  if (sessionToken) {
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));
  }
  deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
  return c.json({ success: true });
});
