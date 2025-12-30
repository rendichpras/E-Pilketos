import { asc, and, eq, desc, lte, gte } from "drizzle-orm";
import { db } from "../../db/client";
import { elections, candidatePairs, auditLogs } from "../../db/schema";

export type CreateCandidateData = {
  electionId: string;
  number: number;
  shortName: string;
  ketuaName: string;
  ketuaClass: string;
  wakilName: string;
  wakilClass: string;
  photoUrl?: string | null;
  vision?: string | null;
  mission?: string | null;
  programs?: string | null;
  isActive?: boolean;
};

export type UpdateCandidateData = {
  number?: number;
  shortName?: string;
  ketuaName?: string;
  ketuaClass?: string;
  wakilName?: string;
  wakilClass?: string;
  photoUrl?: string | null;
  vision?: string | null;
  mission?: string | null;
  programs?: string | null;
  isActive?: boolean;
};

export const candidateRepository = {
  async findById(id: string) {
    const [row] = await db.select().from(candidatePairs).where(eq(candidatePairs.id, id)).limit(1);
    return row ?? null;
  },

  async findByElection(electionId: string) {
    return db
      .select()
      .from(candidatePairs)
      .where(eq(candidatePairs.electionId, electionId))
      .orderBy(asc(candidatePairs.number));
  },

  async findActiveByElection(electionId: string) {
    return db
      .select()
      .from(candidatePairs)
      .where(and(eq(candidatePairs.electionId, electionId), eq(candidatePairs.isActive, true)))
      .orderBy(asc(candidatePairs.number));
  },

  async create(data: CreateCandidateData) {
    const [inserted] = await db
      .insert(candidatePairs)
      .values({
        electionId: data.electionId,
        number: data.number,
        shortName: data.shortName,
        ketuaName: data.ketuaName,
        ketuaClass: data.ketuaClass,
        wakilName: data.wakilName,
        wakilClass: data.wakilClass,
        photoUrl: data.photoUrl,
        vision: data.vision,
        mission: data.mission,
        programs: data.programs,
        isActive: data.isActive ?? true
      })
      .returning();
    return inserted;
  },

  async update(id: string, data: UpdateCandidateData) {
    const [updated] = await db
      .update(candidatePairs)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(candidatePairs.id, id))
      .returning();
    return updated ?? null;
  },

  async delete(id: string) {
    await db.delete(candidatePairs).where(eq(candidatePairs.id, id));
  }
};

export const electionForCandidate = {
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
  }
};

export async function logCandidateAudit(
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
