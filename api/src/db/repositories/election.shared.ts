import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../client";
import { elections } from "../schema";

export const sharedElectionRepository = {
  async findById(id: string) {
    const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    return row ?? null;
  },

  async findBySlug(slug: string) {
    const [row] = await db.select().from(elections).where(eq(elections.slug, slug)).limit(1);
    return row ?? null;
  },

  async findActive() {
    const now = new Date();
    const [row] = await db
      .select()
      .from(elections)
      .where(
        and(eq(elections.status, "ACTIVE"), lte(elections.startAt, now), gte(elections.endAt, now))
      )
      .orderBy(desc(elections.startAt))
      .limit(1);
    return row ?? null;
  },

  async findLatestPublic() {
    const [row] = await db
      .select()
      .from(elections)
      .where(eq(elections.isResultPublic, true))
      .orderBy(desc(elections.endAt))
      .limit(1);
    return row ?? null;
  }
};

export type SharedElection = Awaited<ReturnType<typeof sharedElectionRepository.findById>>;
