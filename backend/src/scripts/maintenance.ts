import "dotenv/config";
import { sql, lte, eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { adminSessions, voterSessions, tokens } from "../db/schema";
import { redactInvalidToken, redactUsedToken } from "../utils/tokenRedact";

async function scrubTokens(status: "USED" | "INVALIDATED", prefix: "USED-" | "INV-") {
  let totalUpdated = 0;

  while (true) {
    const rows = await db
      .select({ id: tokens.id, token: tokens.token })
      .from(tokens)
      .where(and(eq(tokens.status, status), sql<boolean>`${tokens.token} NOT LIKE ${prefix + "%"}`))
      .limit(1000);

    if (rows.length === 0) break;

    for (const r of rows) {
      const next = status === "USED" ? redactUsedToken(r.id) : redactInvalidToken(r.id);
      await db.update(tokens).set({ token: next }).where(eq(tokens.id, r.id));
      totalUpdated += 1;
    }
  }

  return totalUpdated;
}

async function main() {
  const now = new Date();

  const deletedAdmin = await db
    .delete(adminSessions)
    .where(lte(adminSessions.expiresAt, now))
    .returning({ id: adminSessions.id });

  const deletedVoter = await db
    .delete(voterSessions)
    .where(lte(voterSessions.expiresAt, now))
    .returning({ id: voterSessions.id });

  await db.execute(sql`
    DELETE FROM voter_sessions vs
    USING tokens t
    WHERE vs.token_id = t.id
      AND t.status <> 'UNUSED'
  `);

  const usedScrubbed = await scrubTokens("USED", "USED-");
  const invalidScrubbed = await scrubTokens("INVALIDATED", "INV-");

  console.log(
    JSON.stringify(
      {
        ok: true,
        deletedAdminSessions: deletedAdmin.length,
        deletedVoterSessions: deletedVoter.length,
        scrubbedUsedTokens: usedScrubbed,
        scrubbedInvalidTokens: invalidScrubbed
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
