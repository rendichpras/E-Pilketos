import { asc, and, eq, desc, lte, gte, sql } from "drizzle-orm";
import { db as rootDb } from "../../db/client";
import type { DbOrTx } from "../../db/types";
import { elections, candidatePairs, tokens, votes, voterSessions } from "../../db/schema";
import { redactUsedToken } from "../../utils/tokenRedact";
import { hashSessionToken } from "../../core/security/session-token";

function useDb(dbOrTx?: DbOrTx): DbOrTx {
  return (dbOrTx ?? rootDb) as DbOrTx;
}

export const votingRepository = {
  async findElection(id: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    return row ?? null;
  },

  async findActiveCandidates(electionId: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    return db
      .select()
      .from(candidatePairs)
      .where(and(eq(candidatePairs.electionId, electionId), eq(candidatePairs.isActive, true)))
      .orderBy(asc(candidatePairs.number));
  },

  async validateCandidate(candidateId: string, electionId: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    const [row] = await db
      .select({ id: candidatePairs.id })
      .from(candidatePairs)
      .where(
        and(
          eq(candidatePairs.id, candidateId),
          eq(candidatePairs.electionId, electionId),
          eq(candidatePairs.isActive, true)
        )
      )
      .limit(1);
    return !!row;
  },

  async consumeToken(tokenId: string, electionId: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    const now = new Date();

    const [consumed] = await db
      .update(tokens)
      .set({
        status: "USED",
        usedAt: now,
        token: redactUsedToken(tokenId)
      })
      .where(
        and(eq(tokens.id, tokenId), eq(tokens.electionId, electionId), eq(tokens.status, "UNUSED"))
      )
      .returning({ id: tokens.id });

    return !!consumed;
  },

  async recordVote(electionId: string, candidatePairId: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    await db.insert(votes).values({
      electionId,
      candidatePairId
    });
  },

  async deleteVoterSession(sessionToken: string, dbOrTx?: DbOrTx) {
    const db = useDb(dbOrTx);
    const hashed = hashSessionToken(sessionToken);
    await db.delete(voterSessions).where(eq(voterSessions.sessionToken, hashed));
  }
};

export const resultsRepository = {
  async getResults(electionId: string) {
    const [election] = await rootDb
      .select()
      .from(elections)
      .where(eq(elections.id, electionId))
      .limit(1);
    if (!election) return null;

    const candidates = await rootDb
      .select()
      .from(candidatePairs)
      .where(eq(candidatePairs.electionId, electionId))
      .orderBy(asc(candidatePairs.number));

    const counts = await rootDb
      .select({
        candidatePairId: votes.candidatePairId,
        count: sql<number>`count(*)`
      })
      .from(votes)
      .where(eq(votes.electionId, electionId))
      .groupBy(votes.candidatePairId);

    const countMap = new Map<string, number>();
    for (const r of counts) countMap.set(r.candidatePairId, Number(r.count));

    const tokenAgg = await rootDb
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
  },

  async findElectionBySlug(slug: string) {
    const [row] = await rootDb.select().from(elections).where(eq(elections.slug, slug)).limit(1);
    return row ?? null;
  },

  async findActiveElection() {
    const now = new Date();
    const [row] = await rootDb
      .select()
      .from(elections)
      .where(
        and(eq(elections.status, "ACTIVE"), lte(elections.startAt, now), gte(elections.endAt, now))
      )
      .orderBy(desc(elections.startAt))
      .limit(1);
    return row ?? null;
  },

  async findLatestPublicElection() {
    const [row] = await rootDb
      .select()
      .from(elections)
      .where(eq(elections.isResultPublic, true))
      .orderBy(desc(elections.endAt))
      .limit(1);
    return row ?? null;
  }
};
