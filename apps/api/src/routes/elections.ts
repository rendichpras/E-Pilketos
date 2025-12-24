import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, ne, lte, gte } from "drizzle-orm";
import type { AppEnv } from "../app-env";
import { db } from "../db/client";
import { elections, auditLogs } from "../db/schema";
import { adminAuth } from "../middlewares/adminAuth";
import { requireRole } from "../middlewares/requireRole";

const createElectionSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1),
  description: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isResultPublic: z.boolean().optional().default(false)
});

const updateElectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isResultPublic: z.boolean().optional()
});

export const adminElectionsApp = new Hono<AppEnv>();
export const publicElectionsApp = new Hono<AppEnv>();

adminElectionsApp.use("/*", adminAuth);

adminElectionsApp.get("/", async (c) => {
  const rows = await db.select().from(elections).orderBy(desc(elections.createdAt));
  return c.json(rows);
});

adminElectionsApp.get("/:id", async (c) => {
  const { id } = c.req.param();
  const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!row) return c.json({ error: "Election not found" }, 404);
  return c.json(row);
});

adminElectionsApp.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createElectionSchema.safeParse(body);
  if (!parsed.success)
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);
  if (!(startAt < endAt)) return c.json({ error: "startAt must be before endAt" }, 400);

  const admin = c.get("admin");

  try {
    const [inserted] = await db
      .insert(elections)
      .values({
        slug: data.slug,
        name: data.name,
        description: data.description,
        startAt,
        endAt,
        isResultPublic: data.isResultPublic
      })
      .returning();

    if (admin) {
      await db.insert(auditLogs).values({
        adminId: admin.adminId,
        electionId: inserted.id,
        action: "CREATE_ELECTION",
        metadata: { slug: inserted.slug }
      });
    }

    return c.json(inserted, 201);
  } catch (e: unknown) {
    const pgErr = e as { code?: string; constraint?: string };
    if (pgErr?.code === "23505" && pgErr?.constraint === "elections_slug_unique") {
      return c.json({ error: "Slug already in use" }, 409);
    }
    throw e;
  }
});

adminElectionsApp.put("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = updateElectionSchema.safeParse(body);
  if (!parsed.success)
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

  const data = parsed.data;

  const [current] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!current) return c.json({ error: "Election not found" }, 404);

  if (current.status !== "DRAFT" && (data.startAt || data.endAt)) {
    return c.json({ error: "Jadwal pemilihan tidak bisa diubah setelah ACTIVE/CLOSED" }, 400);
  }

  const startAt =
    current.status === "DRAFT"
      ? data.startAt
        ? new Date(data.startAt)
        : current.startAt
      : current.startAt;
  const endAt =
    current.status === "DRAFT"
      ? data.endAt
        ? new Date(data.endAt)
        : current.endAt
      : current.endAt;

  if (!(startAt < endAt)) return c.json({ error: "startAt must be before endAt" }, 400);

  if (typeof data.isResultPublic !== "undefined") {
    return c.json({ error: "Gunakan endpoint publish/hide hasil, bukan PUT election." }, 400);
  }

  const [updated] = await db
    .update(elections)
    .set({
      name: data.name ?? current.name,
      description: data.description ?? current.description,
      startAt,
      endAt,
      isResultPublic: data.isResultPublic ?? current.isResultPublic,
      updatedAt: new Date()
    })
    .where(eq(elections.id, id))
    .returning();

  const admin = c.get("admin");
  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "UPDATE_ELECTION",
      metadata: { fields: Object.keys(data) }
    });
  }

  return c.json(updated);
});

adminElectionsApp.post("/:id/activate", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!target) return c.json({ error: "Election not found" }, 404);

  if (target.status !== "DRAFT") {
    return c.json({ error: "Hanya election DRAFT yang bisa diaktifkan" }, 400);
  }

  const now = new Date();
  if (!(target.startAt <= now && now <= target.endAt)) {
    return c.json({ error: "Cannot activate election outside of its time window" }, 400);
  }

  const admin = c.get("admin");

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(elections)
        .set({ status: "CLOSED", updatedAt: new Date() })
        .where(and(eq(elections.status, "ACTIVE"), ne(elections.id, id)));

      await tx
        .update(elections)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(elections.id, id));

      if (admin) {
        await tx.insert(auditLogs).values({
          adminId: admin.adminId,
          electionId: target.id,
          action: "ACTIVATE_ELECTION",
          metadata: { slug: target.slug }
        });
      }
    });
  } catch (e: unknown) {
    const pgErr = e as { code?: string; constraint?: string };
    if (pgErr?.code === "23505" && pgErr?.constraint === "elections_single_active_unique") {
      return c.json({ error: "Masih ada pemilihan lain yang ACTIVE. Coba lagi." }, 409);
    }
    throw e;
  }

  const [updated] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  return c.json(updated);
});

adminElectionsApp.post("/:id/close", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!target) return c.json({ error: "Election not found" }, 404);

  if (target.status !== "ACTIVE") {
    return c.json({ error: "Hanya election ACTIVE yang bisa ditutup" }, 400);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(elections)
    .set({ status: "CLOSED", updatedAt: new Date() })
    .where(eq(elections.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "CLOSE_ELECTION",
      metadata: { slug: updated.slug }
    });
  }

  return c.json(updated);
});

adminElectionsApp.post("/:id/archive", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!target) return c.json({ error: "Election not found" }, 404);

  if (target.status !== "CLOSED") {
    return c.json({ error: "Hanya election CLOSED yang bisa di-archive" }, 400);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(elections)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(elections.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "ARCHIVE_ELECTION",
      metadata: { slug: updated.slug }
    });
  }

  return c.json(updated);
});

adminElectionsApp.post("/:id/publish-results", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!target) return c.json({ error: "Election not found" }, 404);

  if (target.status !== "CLOSED") {
    return c.json({ error: "Hasil hanya bisa dipublish setelah election CLOSED" }, 400);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(elections)
    .set({ isResultPublic: true, updatedAt: new Date() })
    .where(eq(elections.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "PUBLISH_RESULTS",
      metadata: { slug: updated.slug }
    });
  }

  return c.json(updated);
});

adminElectionsApp.post("/:id/hide-results", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!target) return c.json({ error: "Election not found" }, 404);

  if (target.status !== "CLOSED") {
    return c.json({ error: "Hasil hanya bisa diubah setelah election CLOSED" }, 400);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(elections)
    .set({ isResultPublic: false, updatedAt: new Date() })
    .where(eq(elections.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "HIDE_RESULTS",
      metadata: { slug: updated.slug }
    });
  }

  return c.json(updated);
});

publicElectionsApp.get("/latest", async (c) => {
  const rows = await db
    .select()
    .from(elections)
    .where(and(ne(elections.status, "DRAFT"), ne(elections.status, "ARCHIVED")))
    .orderBy(desc(elections.endAt))
    .limit(1);

  return c.json({ latestElection: rows[0] ?? null });
});

publicElectionsApp.get("/active", async (c) => {
  const now = new Date();

  const rows = await db
    .select()
    .from(elections)
    .where(
      and(eq(elections.status, "ACTIVE"), lte(elections.startAt, now), gte(elections.endAt, now))
    )
    .orderBy(desc(elections.startAt))
    .limit(1);

  return c.json({ activeElection: rows[0] ?? null });
});
