import { Hono } from "hono";
import { and, asc, eq, sql, lte, gte } from "drizzle-orm";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, candidatePairs, votes, tokens } from "../../db/schema";
import { adminAuth } from "../../middlewares/adminAuth";

export const adminResultsApp = new Hono<AppEnv>();
export const publicResultsApp = new Hono<AppEnv>();

adminResultsApp.use("/*", adminAuth);

// GET /admin/results/:electionId
adminResultsApp.get("/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [electionRow] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (!electionRow) {
    return c.json({ error: "Election not found" }, 404);
  }

  const candidateResults = await db
    .select({
      candidateId: candidatePairs.id,
      number: candidatePairs.number,
      shortName: candidatePairs.shortName,
      ketuaName: candidatePairs.ketuaName,
      wakilName: candidatePairs.wakilName,
      totalVotes: sql<number>`count(${votes.id})`
    })
    .from(candidatePairs)
    .leftJoin(
      votes,
      and(eq(votes.electionId, electionId), eq(votes.candidatePairId, candidatePairs.id))
    )
    .where(eq(candidatePairs.electionId, electionId))
    .groupBy(
      candidatePairs.id,
      candidatePairs.number,
      candidatePairs.shortName,
      candidatePairs.ketuaName,
      candidatePairs.wakilName
    )
    .orderBy(asc(candidatePairs.number));

  const [totalTokensRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokens)
    .where(eq(tokens.electionId, electionId));

  const [usedTokensRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokens)
    .where(and(eq(tokens.electionId, electionId), eq(tokens.status, "USED")));

  const [unusedTokensRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokens)
    .where(and(eq(tokens.electionId, electionId), eq(tokens.status, "UNUSED")));

  const [invalidTokensRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokens)
    .where(and(eq(tokens.electionId, electionId), eq(tokens.status, "INVALIDATED")));

  const totalTokens = Number(totalTokensRow?.count ?? 0);
  const usedTokens = Number(usedTokensRow?.count ?? 0);
  const unusedTokens = Number(unusedTokensRow?.count ?? 0);
  const invalidTokens = Number(invalidTokensRow?.count ?? 0);

  const totalVotes = candidateResults.reduce((acc, r) => acc + Number(r.totalVotes ?? 0), 0);

  return c.json({
    election: electionRow,
    summary: {
      totalTokens,
      usedTokens,
      unusedTokens,
      invalidTokens,
      totalVotes
    },
    candidates: candidateResults
  });
});

// GET /public/results?electionSlug=...
publicResultsApp.get("/", async (c) => {
  const electionSlug = c.req.query("electionSlug");
  const now = new Date();

  let electionRow: typeof elections.$inferSelect | undefined;

  if (electionSlug) {
    const rows = await db.select().from(elections).where(eq(elections.slug, electionSlug)).limit(1);
    electionRow = rows[0];
  } else {
    const rows = await db
      .select()
      .from(elections)
      .where(
        and(
          eq(elections.status, "CLOSED"),
          eq(elections.isResultPublic, true),
          lte(elections.startAt, now)
        )
      )
      .orderBy(asc(elections.startAt));
    electionRow = rows[rows.length - 1];
  }

  if (!electionRow) {
    return c.json({
      election: null,
      candidates: [],
      summary: null
    });
  }

  if (electionRow.status !== "CLOSED" || !electionRow.isResultPublic) {
    return c.json(
      {
        error: "Hasil pemilihan ini tidak dibuka untuk publik"
      },
      403
    );
  }

  const candidateResults = await db
    .select({
      candidateId: candidatePairs.id,
      number: candidatePairs.number,
      shortName: candidatePairs.shortName,
      ketuaName: candidatePairs.ketuaName,
      wakilName: candidatePairs.wakilName,
      totalVotes: sql<number>`count(${votes.id})`
    })
    .from(candidatePairs)
    .leftJoin(
      votes,
      and(eq(votes.electionId, electionRow.id), eq(votes.candidatePairId, candidatePairs.id))
    )
    .where(eq(candidatePairs.electionId, electionRow.id))
    .groupBy(
      candidatePairs.id,
      candidatePairs.number,
      candidatePairs.shortName,
      candidatePairs.ketuaName,
      candidatePairs.wakilName
    )
    .orderBy(asc(candidatePairs.number));

  const totalVotes = candidateResults.reduce((acc, r) => acc + Number(r.totalVotes ?? 0), 0);

  return c.json({
    election: electionRow,
    summary: {
      totalVotes
    },
    candidates: candidateResults
  });
});
