import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, lte, gte } from "drizzle-orm";
import crypto from "crypto";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, candidatePairs, tokens, votes } from "../../db/schema";
import { voterAuth } from "../../middlewares/voterAuth";

const voteSchema = z.object({
  candidatePairId: z.string().uuid()
});

export const voterApp = new Hono<AppEnv>();

voterApp.use("/*", voterAuth);

voterApp.get("/candidates", async (c) => {
  const voter = c.get("voter");
  if (!voter) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { electionId } = voter;
  const now = new Date();

  const [electionRow] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (
    !electionRow ||
    electionRow.status !== "ACTIVE" ||
    !(electionRow.startAt <= now && now <= electionRow.endAt)
  ) {
    return c.json({ error: "Pemilihan tidak aktif atau di luar jadwal" }, 400);
  }

  const candidatesRows = await db
    .select()
    .from(candidatePairs)
    .where(and(eq(candidatePairs.electionId, electionId), eq(candidatePairs.isActive, true)))
    .orderBy(asc(candidatePairs.number));

  return c.json({
    election: electionRow,
    candidates: candidatesRows
  });
});

voterApp.post("/vote", async (c) => {
  const voter = c.get("voter");
  if (!voter) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { tokenId, electionId } = voter;
  const body = await c.req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const { candidatePairId } = parsed.data;
  const now = new Date();

  const [electionRow] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (
    !electionRow ||
    electionRow.status !== "ACTIVE" ||
    !(electionRow.startAt <= now && now <= electionRow.endAt)
  ) {
    return c.json({ error: "Pemilihan tidak aktif atau di luar jadwal" }, 400);
  }

  const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "";
  const ipHash = ip && ip.length > 0 ? crypto.createHash("sha256").update(ip).digest("hex") : null;

  const userAgent = c.req.header("user-agent") ?? null;

  try {
    await db.transaction(async (tx) => {
      const [tokenRow] = await tx.select().from(tokens).where(eq(tokens.id, tokenId)).limit(1);

      if (!tokenRow) {
        throw new Error("TOKEN_NOT_FOUND");
      }

      if (tokenRow.electionId !== electionId) {
        throw new Error("TOKEN_ELECTION_MISMATCH");
      }

      if (tokenRow.status !== "UNUSED") {
        throw new Error("TOKEN_ALREADY_USED");
      }

      const [candidateRow] = await tx
        .select()
        .from(candidatePairs)
        .where(eq(candidatePairs.id, candidatePairId))
        .limit(1);

      if (!candidateRow) {
        throw new Error("CANDIDATE_NOT_FOUND");
      }

      if (candidateRow.electionId !== electionId) {
        throw new Error("CANDIDATE_ELECTION_MISMATCH");
      }

      await tx.insert(votes).values({
        electionId,
        tokenId,
        candidatePairId,
        clientIpHash: ipHash ?? undefined,
        userAgent: userAgent ?? undefined
      });

      await tx
        .update(tokens)
        .set({
          status: "USED",
          usedAt: new Date()
        })
        .where(eq(tokens.id, tokenId));
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";

    if (message === "TOKEN_ALREADY_USED") {
      return c.json({ error: "Token sudah digunakan untuk memilih" }, 400);
    }

    if (message === "TOKEN_NOT_FOUND" || message === "TOKEN_ELECTION_MISMATCH") {
      return c.json({ error: "Token tidak valid" }, 400);
    }

    if (message === "CANDIDATE_NOT_FOUND" || message === "CANDIDATE_ELECTION_MISMATCH") {
      return c.json({ error: "Pasangan calon tidak valid" }, 400);
    }

    console.error("Vote error", err);
    return c.json({ error: "Gagal menyimpan suara" }, 500);
  }

  return c.json({ success: true }, 201);
});
