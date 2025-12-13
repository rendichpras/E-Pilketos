import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, ne, lte, gte } from "drizzle-orm";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, auditLogs } from "../../db/schema";
import { adminAuth } from "../../middlewares/adminAuth";

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

  if (!row) {
    return c.json({ error: "Election not found" }, 404);
  }

  return c.json(row);
});

adminElectionsApp.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createElectionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  if (!(startAt < endAt)) {
    return c.json({ error: "startAt must be before endAt" }, 400);
  }

  const existingSlug = await db
    .select()
    .from(elections)
    .where(eq(elections.slug, data.slug))
    .limit(1);

  if (existingSlug.length > 0) {
    return c.json({ error: "Slug already in use" }, 409);
  }

  const admin = c.get("admin");

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
      metadata: {
        slug: inserted.slug
      }
    });
  }

  return c.json(inserted, 201);
});

adminElectionsApp.put("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = updateElectionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  const [current] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);

  if (!current) {
    return c.json({ error: "Election not found" }, 404);
  }

  const startAt = data.startAt ? new Date(data.startAt) : current.startAt;
  const endAt = data.endAt ? new Date(data.endAt) : current.endAt;

  if (!(startAt < endAt)) {
    return c.json({ error: "startAt must be before endAt" }, 400);
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
      metadata: {
        fields: Object.keys(data)
      }
    });
  }

  return c.json(updated);
});

adminElectionsApp.post("/:id/activate", async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);

  if (!target) {
    return c.json({ error: "Election not found" }, 404);
  }

  const now = new Date();
  const startAt = target.startAt;
  const endAt = target.endAt;

  if (!(startAt <= now && now <= endAt)) {
    return c.json(
      {
        error: "Cannot activate election outside of its time window"
      },
      400
    );
  }

  const admin = c.get("admin");

  await db.transaction(async (tx) => {
    await tx
      .update(elections)
      .set({
        status: "CLOSED",
        updatedAt: new Date()
      })
      .where(and(eq(elections.status, "ACTIVE"), ne(elections.id, id)));

    await tx
      .update(elections)
      .set({
        status: "ACTIVE",
        updatedAt: new Date()
      })
      .where(eq(elections.id, id));

    if (admin) {
      await tx.insert(auditLogs).values({
        adminId: admin.adminId,
        electionId: target.id,
        action: "ACTIVATE_ELECTION",
        metadata: {
          slug: target.slug
        }
      });
    }
  });

  const [updated] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);

  return c.json(updated);
});

adminElectionsApp.post("/:id/close", async (c) => {
  const { id } = c.req.param();

  const [target] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);

  if (!target) {
    return c.json({ error: "Election not found" }, 404);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(elections)
    .set({
      status: "CLOSED",
      updatedAt: new Date()
    })
    .where(eq(elections.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.id,
      action: "CLOSE_ELECTION",
      metadata: {
        slug: updated.slug
      }
    });
  }

  return c.json(updated);
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

  const active = rows[0] ?? null;

  return c.json({
    activeElection: active
  });
});
