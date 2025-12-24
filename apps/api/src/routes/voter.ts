import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { deleteCookie } from "hono/cookie";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { elections, candidatePairs, tokens, votes, voterSessions } from "../db/schema";
import { voterAuth } from "../middlewares/voterAuth";
import { rateLimit, getClientIp, rateLimitConfig } from "../middlewares/rateLimit";
import { env as appEnv } from "../env";
import { redactUsedToken } from "../utils/tokenRedact";

const voteSchema = z.object({
  candidatePairId: z.string().uuid()
});

export const voterApp = new Hono<AppEnv>();

voterApp.use("/*", voterAuth);

voterApp.get("/candidates", async (c) => {
  const voter = c.get("voter");
  if (!voter) return c.json({ error: "Unauthorized" }, 401);

  const { electionId } = voter;
  const now = new Date();

  const [electionRow] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  const inactive =
    !electionRow ||
    electionRow.status !== "ACTIVE" ||
    !(electionRow.startAt <= now && now <= electionRow.endAt);

  if (inactive) {
    return c.json(
      { error: "Pemilihan tidak aktif atau di luar jadwal", code: "ELECTION_INACTIVE" },
      400
    );
  }

  const candidatesRows = await db
    .select()
    .from(candidatePairs)
    .where(and(eq(candidatePairs.electionId, electionId), eq(candidatePairs.isActive, true)))
    .orderBy(asc(candidatePairs.number));

  return c.json({ election: electionRow, candidates: candidatesRows });
});

voterApp.post(
  "/vote",
  rateLimit({
    windowSec: appEnv.RATE_LIMIT_VOTE_WINDOW_SEC,
    max: appEnv.RATE_LIMIT_VOTE_MAX,
    prefix: rateLimitConfig.vote.prefix,
    id: (c) => {
      const v = c.get("voter") as any;
      return v?.tokenId ? String(v.tokenId) : getClientIp(c);
    }
  }),
  async (c) => {
    const voter = c.get("voter");
    if (!voter) return c.json({ error: "Unauthorized" }, 401);

    const { sessionToken, tokenId, electionId } = voter;
    const body = await c.req.json().catch(() => null);
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success)
      return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

    const { candidatePairId } = parsed.data;
    const now = new Date();

    const [electionRow] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId))
      .limit(1);

    const inactive =
      !electionRow ||
      electionRow.status !== "ACTIVE" ||
      !(electionRow.startAt <= now && now <= electionRow.endAt);

    if (inactive) {
      return c.json(
        { error: "Pemilihan tidak aktif atau di luar jadwal", code: "ELECTION_INACTIVE" },
        400
      );
    }

    const result = await db.transaction(async (tx) => {
      const [candidateRow] = await tx
        .select({ id: candidatePairs.id })
        .from(candidatePairs)
        .where(
          and(
            eq(candidatePairs.id, candidatePairId),
            eq(candidatePairs.electionId, electionId),
            eq(candidatePairs.isActive, true)
          )
        )
        .limit(1);

      if (!candidateRow) return { ok: false as const, error: "CANDIDATE_INVALID" as const };

      const [consumed] = await tx
        .update(tokens)
        .set({
          status: "USED",
          usedAt: now,
          token: redactUsedToken(tokenId)
        })
        .where(
          and(
            eq(tokens.id, tokenId),
            eq(tokens.electionId, electionId),
            eq(tokens.status, "UNUSED")
          )
        )
        .returning({ id: tokens.id });

      if (!consumed) {
        await tx.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));
        return { ok: false as const, error: "TOKEN_ALREADY_USED" as const };
      }

      await tx.insert(votes).values({
        electionId,
        candidatePairId
      });

      await tx.delete(voterSessions).where(eq(voterSessions.sessionToken, sessionToken));

      return { ok: true as const };
    });

    if (!result.ok) {
      deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });

      if (result.error === "TOKEN_ALREADY_USED")
        return c.json({ error: "Token sudah digunakan", code: "TOKEN_USED" }, 409);

      if (result.error === "CANDIDATE_INVALID")
        return c.json({ error: "Pasangan calon tidak valid", code: "CANDIDATE_INVALID" }, 400);

      return c.json({ error: "Gagal menyimpan suara" }, 500);
    }

    deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
    return c.json({ success: true }, 201);
  }
);
