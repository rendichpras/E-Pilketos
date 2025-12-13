import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { elections, tokens, votes, voterSessions } from "../db/schema";

type Problem =
  | { type: "MULTI_ACTIVE_ELECTION"; activeCount: number }
  | {
      type: "VOTE_TOKEN_MISMATCH";
      electionId: string;
      slug: string;
      usedTokens: number;
      votes: number;
    }
  | { type: "STALE_VOTER_SESSIONS"; count: number };

async function main() {
  const problems: Problem[] = [];

  const activeRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(elections)
    .where(eq(elections.status, "ACTIVE"));
  const activeCount = Number(activeRows[0]?.count ?? 0);
  if (activeCount > 1) problems.push({ type: "MULTI_ACTIVE_ELECTION", activeCount });

  const all = await db.select({ id: elections.id, slug: elections.slug }).from(elections);
  for (const e of all) {
    const usedRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(tokens)
      .where(and(eq(tokens.electionId, e.id), eq(tokens.status, "USED")));
    const usedTokens = Number(usedRow[0]?.count ?? 0);

    const voteRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.electionId, e.id));
    const voteCount = Number(voteRow[0]?.count ?? 0);

    if (usedTokens !== voteCount) {
      problems.push({
        type: "VOTE_TOKEN_MISMATCH",
        electionId: e.id,
        slug: e.slug,
        usedTokens,
        votes: voteCount
      });
    }
  }

  const stale = await db.execute(sql`
    select count(*)::int as count
    from voter_sessions vs
    join tokens t on t.id = vs.token_id
    where t.status <> 'UNUSED'
  `);
  const staleCount = Number((stale as any)?.rows?.[0]?.count ?? 0);
  if (staleCount > 0) problems.push({ type: "STALE_VOTER_SESSIONS", count: staleCount });

  if (problems.length) {
    console.error(JSON.stringify({ ok: false, problems }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
