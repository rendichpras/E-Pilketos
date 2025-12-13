import { Hono } from "hono";
import { z } from "zod";
import { and, eq, lte, gte } from "drizzle-orm";
import { setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, tokens } from "../../db/schema";
import { signVoterJwt } from "../../utils/jwt";
import { env as appEnv } from "../../env";

const tokenLoginSchema = z.object({
  token: z.string().min(1)
});

export const voterAuthApp = new Hono<AppEnv>();

voterAuthApp.post("/token-login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = tokenLoginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const rawToken = parsed.data.token;
  const normalizedToken = rawToken.trim().toUpperCase();

  const now = new Date();

  const [row] = await db
    .select({
      token: tokens,
      election: elections
    })
    .from(tokens)
    .innerJoin(elections, eq(tokens.electionId, elections.id))
    .where(
      and(
        eq(tokens.token, normalizedToken),
        eq(tokens.status, "UNUSED"),
        eq(elections.status, "ACTIVE"),
        lte(elections.startAt, now),
        gte(elections.endAt, now)
      )
    )
    .limit(1);

  if (!row) {
    return c.json(
      {
        error: "Token tidak valid, sudah digunakan, atau pemilihan tidak aktif"
      },
      401
    );
  }

  const jwt = signVoterJwt({
    tokenId: row.token.id,
    electionId: row.election.id
  });

  setCookie(c, "voter_session", jwt, {
    httpOnly: true,
    secure: appEnv.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/"
  });

  return c.json({
    electionId: row.election.id,
    electionSlug: row.election.slug,
    electionName: row.election.name
  });
});

voterAuthApp.post("/token-logout", async (c) => {
  deleteCookie(c, "voter_session", { path: "/" });
  return c.json({ success: true });
});
