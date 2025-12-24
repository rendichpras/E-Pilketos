import "dotenv/config";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db/client";
import { elections, auditLogs } from "../db/schema";

async function main() {
  const now = new Date();

  const endedActive = await db
    .select()
    .from(elections)
    .where(and(eq(elections.status, "ACTIVE"), lt(elections.endAt, now)));

  for (const e of endedActive) {
    const [updated] = await db
      .update(elections)
      .set({ status: "CLOSED", updatedAt: now })
      .where(eq(elections.id, e.id))
      .returning();

    await db.insert(auditLogs).values({
      adminId: null,
      electionId: updated.id,
      action: "AUTO_CLOSE_ELECTION",
      metadata: { slug: updated.slug, closedAt: now.toISOString() }
    });
  }

  console.log(
    JSON.stringify({ ok: true, closedCount: endedActive.length, time: now.toISOString() }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
