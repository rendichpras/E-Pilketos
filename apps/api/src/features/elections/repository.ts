import { and, desc, eq, ne, lte, gte } from "drizzle-orm";
import { db } from "../../db/client";
import { elections, auditLogs } from "../../db/schema";

export type CreateElectionData = {
  slug: string;
  name: string;
  description: string;
  startAt: Date;
  endAt: Date;
  isResultPublic?: boolean;
};

export type UpdateElectionData = {
  name?: string;
  description?: string;
  startAt?: Date;
  endAt?: Date;
};

export const electionRepository = {
  async findById(id: string) {
    const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    return row ?? null;
  },

  async findBySlug(slug: string) {
    const [row] = await db.select().from(elections).where(eq(elections.slug, slug)).limit(1);
    return row ?? null;
  },

  async findAll() {
    return db.select().from(elections).orderBy(desc(elections.createdAt));
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

  async findLatest() {
    const [row] = await db
      .select()
      .from(elections)
      .where(and(ne(elections.status, "DRAFT"), ne(elections.status, "ARCHIVED")))
      .orderBy(desc(elections.endAt))
      .limit(1);
    return row ?? null;
  },

  async create(data: CreateElectionData) {
    const [inserted] = await db
      .insert(elections)
      .values({
        slug: data.slug,
        name: data.name,
        description: data.description,
        startAt: data.startAt,
        endAt: data.endAt,
        isResultPublic: data.isResultPublic ?? false
      })
      .returning();
    return inserted;
  },

  async update(id: string, data: UpdateElectionData) {
    const [updated] = await db
      .update(elections)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(elections.id, id))
      .returning();
    return updated ?? null;
  },

  async updateStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED") {
    const [updated] = await db
      .update(elections)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(elections.id, id))
      .returning();
    return updated ?? null;
  },

  async setResultPublic(id: string, isResultPublic: boolean) {
    const [updated] = await db
      .update(elections)
      .set({
        isResultPublic,
        updatedAt: new Date()
      })
      .where(eq(elections.id, id))
      .returning();
    return updated ?? null;
  },

  async closeOtherActive(exceptId: string) {
    await db
      .update(elections)
      .set({ status: "CLOSED", updatedAt: new Date() })
      .where(and(eq(elections.status, "ACTIVE"), ne(elections.id, exceptId)));
  }
};

export async function logAudit(
  adminId: string,
  electionId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    adminId,
    electionId,
    action,
    metadata: metadata ?? null
  });
}
