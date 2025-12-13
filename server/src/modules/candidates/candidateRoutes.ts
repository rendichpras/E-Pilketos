import { Hono } from "hono";
import { z } from "zod";
import { and, asc, desc, eq, lte, gte } from "drizzle-orm";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, candidatePairs, auditLogs } from "../../db/schema";
import { adminAuth } from "../../middlewares/adminAuth";

const createCandidateSchema = z.object({
  number: z.number().int().min(1),
  shortName: z.string().min(1).max(100),
  ketuaName: z.string().min(1).max(100),
  ketuaClass: z.string().min(1).max(50),
  wakilName: z.string().min(1).max(100),
  wakilClass: z.string().min(1).max(50),
  photoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  vision: z.string().optional(),
  mission: z.string().optional(),
  programs: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

const updateCandidateSchema = z.object({
  number: z.number().int().min(1).optional(),
  shortName: z.string().min(1).max(100).optional(),
  ketuaName: z.string().min(1).max(100).optional(),
  ketuaClass: z.string().min(1).max(50).optional(),
  wakilName: z.string().min(1).max(100).optional(),
  wakilClass: z.string().min(1).max(50).optional(),
  photoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  vision: z.string().optional(),
  mission: z.string().optional(),
  programs: z.string().optional(),
  isActive: z.boolean().optional()
});

export const adminCandidatesApp = new Hono<AppEnv>();
export const publicCandidatesApp = new Hono<AppEnv>();

adminCandidatesApp.use("/*", adminAuth);

// GET /admin/candidates/election/:electionId
adminCandidatesApp.get("/election/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);

  if (!election) {
    return c.json({ error: "Election not found" }, 404);
  }

  const rows = await db
    .select()
    .from(candidatePairs)
    .where(eq(candidatePairs.electionId, electionId))
    .orderBy(asc(candidatePairs.number));

  return c.json({
    election,
    candidates: rows
  });
});

// POST /admin/candidates/election/:electionId
adminCandidatesApp.post("/election/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);

  if (!election) {
    return c.json({ error: "Election not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createCandidateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const admin = c.get("admin");

  const [inserted] = await db
    .insert(candidatePairs)
    .values({
      electionId,
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

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId,
      action: "CREATE_CANDIDATE",
      metadata: {
        candidateId: inserted.id,
        number: inserted.number
      }
    });
  }

  return c.json(inserted, 201);
});

// PUT /admin/candidates/:id
adminCandidatesApp.put("/:id", async (c) => {
  const { id } = c.req.param();

  const [current] = await db
    .select()
    .from(candidatePairs)
    .where(eq(candidatePairs.id, id))
    .limit(1);

  if (!current) {
    return c.json({ error: "Candidate not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateCandidateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const admin = c.get("admin");

  const [updated] = await db
    .update(candidatePairs)
    .set({
      number: data.number ?? current.number,
      shortName: data.shortName ?? current.shortName,
      ketuaName: data.ketuaName ?? current.ketuaName,
      ketuaClass: data.ketuaClass ?? current.ketuaClass,
      wakilName: data.wakilName ?? current.wakilName,
      wakilClass: data.wakilClass ?? current.wakilClass,
      photoUrl: data.photoUrl ?? current.photoUrl,
      vision: data.vision ?? current.vision,
      mission: data.mission ?? current.mission,
      programs: data.programs ?? current.programs,
      isActive: data.isActive ?? current.isActive,
      updatedAt: new Date()
    })
    .where(eq(candidatePairs.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.electionId,
      action: "UPDATE_CANDIDATE",
      metadata: {
        candidateId: updated.id
      }
    });
  }

  return c.json(updated);
});

// DELETE /admin/candidates/:id
adminCandidatesApp.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const [current] = await db
    .select()
    .from(candidatePairs)
    .where(eq(candidatePairs.id, id))
    .limit(1);

  if (!current) {
    return c.json({ error: "Candidate not found" }, 404);
  }

  const admin = c.get("admin");

  await db.delete(candidatePairs).where(eq(candidatePairs.id, id));

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: current.electionId,
      action: "DELETE_CANDIDATE",
      metadata: {
        candidateId: current.id
      }
    });
  }

  return c.json({ success: true });
});

// GET /public/candidates?electionSlug=...
publicCandidatesApp.get("/", async (c) => {
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
        and(eq(elections.status, "ACTIVE"), lte(elections.startAt, now), gte(elections.endAt, now))
      )
      .orderBy(desc(elections.startAt))
      .limit(1);
    electionRow = rows[0];
  }

  if (!electionRow) {
    return c.json({
      election: null,
      candidates: []
    });
  }

  const rows = await db
    .select()
    .from(candidatePairs)
    .where(and(eq(candidatePairs.electionId, electionRow.id), eq(candidatePairs.isActive, true)))
    .orderBy(asc(candidatePairs.number));

  return c.json({
    election: electionRow,
    candidates: rows
  });
});
