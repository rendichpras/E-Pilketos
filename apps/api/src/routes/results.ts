import { Hono } from "hono";
import { z } from "zod";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { candidatePairs, elections, tokens, votes } from "../db/schema";
import { adminAuth } from "../middlewares/adminAuth";

export const adminResultsApp = new Hono<AppEnv>();
export const publicResultsApp = new Hono<AppEnv>();

adminResultsApp.use("/*", adminAuth);

const publicQuerySchema = z.object({
  electionSlug: z.string().optional()
});

async function getElectionBySlug(slug: string) {
  const [e] = await db.select().from(elections).where(eq(elections.slug, slug)).limit(1);
  return e ?? null;
}

async function getActiveElectionNow() {
  const now = new Date();
  const [e] = await db
    .select()
    .from(elections)
    .where(
      and(eq(elections.status, "ACTIVE"), lte(elections.startAt, now), gte(elections.endAt, now))
    )
    .orderBy(desc(elections.startAt))
    .limit(1);

  return e ?? null;
}

async function getLatestPublicElection() {
  const [e] = await db
    .select()
    .from(elections)
    .where(eq(elections.isResultPublic, true))
    .orderBy(desc(elections.endAt))
    .limit(1);

  return e ?? null;
}

async function buildResults(electionId: string) {
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) return null;

  const candidates = await db
    .select()
    .from(candidatePairs)
    .where(eq(candidatePairs.electionId, electionId))
    .orderBy(asc(candidatePairs.number));

  const counts = await db
    .select({
      candidatePairId: votes.candidatePairId,
      count: sql<number>`count(*)`
    })
    .from(votes)
    .where(eq(votes.electionId, electionId))
    .groupBy(votes.candidatePairId);

  const countMap = new Map<string, number>();
  for (const r of counts) countMap.set(r.candidatePairId, Number(r.count));

  const tokenAgg = await db
    .select({
      used: sql<number>`sum(case when ${tokens.status}='USED' then 1 else 0 end)`,
      unused: sql<number>`sum(case when ${tokens.status}='UNUSED' then 1 else 0 end)`,
      invalidated: sql<number>`sum(case when ${tokens.status}='INVALIDATED' then 1 else 0 end)`,
      total: sql<number>`count(*)`
    })
    .from(tokens)
    .where(eq(tokens.electionId, electionId));

  const stats = tokenAgg[0] ?? { used: 0, unused: 0, invalidated: 0, total: 0 };

  const resultRows = candidates.map((c) => ({
    candidate: c,
    voteCount: countMap.get(c.id) ?? 0
  }));

  const totalVotes = resultRows.reduce((a, b) => a + b.voteCount, 0);

  return {
    election,
    totalVotes,
    results: resultRows,
    tokenStats: {
      used: Number(stats.used ?? 0),
      unused: Number(stats.unused ?? 0),
      invalidated: Number(stats.invalidated ?? 0),
      total: Number(stats.total ?? 0)
    }
  };
}

adminResultsApp.get("/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const data = await buildResults(electionId);
  if (!data) return c.json({ error: "Election not found" }, 404);

  return c.json(data);
});

publicResultsApp.get("/", async (c) => {
  const parsed = publicQuerySchema.safeParse({
    electionSlug: c.req.query("electionSlug") ?? undefined
  });
  if (!parsed.success) return c.json({ error: "Invalid query" }, 400);

  const slug = parsed.data.electionSlug?.trim();

  const election = slug
    ? await getElectionBySlug(slug)
    : ((await getActiveElectionNow()) ?? (await getLatestPublicElection()));

  if (!election) {
    return c.json({ election: null, totalVotes: 0, results: [] });
  }

  if (!election.isResultPublic) {
    return c.json({ error: "Hasil belum dipublikasikan" }, 403);
  }

  const data = await buildResults(election.id);
  if (!data) return c.json({ error: "Election not found" }, 404);

  return c.json({
    election: data.election,
    totalVotes: data.totalVotes,
    results: data.results
  });
});
