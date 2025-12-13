import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, tokens, auditLogs } from "../../db/schema";
import { adminAuth } from "../../middlewares/adminAuth";

const generateTokensSchema = z.object({
  count: z.number().int().min(1).max(10000),
  batchLabel: z.string().max(128).optional()
});

const listTokensQuerySchema = z.object({
  status: z.enum(["UNUSED", "USED", "INVALIDATED"]).optional(),
  batch: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
});

function generateTokenString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  const arr: string[] = [];

  for (let i = 0; i < 8; i++) {
    const idx = bytes[i] % chars.length;
    arr.push(chars[idx]);
  }

  return `${arr.slice(0, 4).join("")}-${arr.slice(4, 8).join("")}`;
}

export const adminTokensApp = new Hono<AppEnv>();

adminTokensApp.use("/*", adminAuth);

// POST /admin/tokens/generate/:electionId
adminTokensApp.post("/generate/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);

  if (!election) {
    return c.json({ error: "Election not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = generateTokensSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const { count, batchLabel } = parsed.data;
  const admin = c.get("admin");

  const created: (typeof tokens.$inferSelect)[] = [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < count; i++) {
      let tokenStr: string;

      while (true) {
        tokenStr = generateTokenString();

        const existing = await tx
          .select({ id: tokens.id })
          .from(tokens)
          .where(and(eq(tokens.electionId, electionId), eq(tokens.token, tokenStr)))
          .limit(1);

        if (existing.length === 0) break;
      }

      const [inserted] = await tx
        .insert(tokens)
        .values({
          electionId,
          token: tokenStr,
          generatedBatch: batchLabel
        })
        .returning();

      created.push(inserted);
    }

    if (admin) {
      await tx.insert(auditLogs).values({
        adminId: admin.adminId,
        electionId,
        action: "GENERATE_TOKENS",
        metadata: {
          count,
          batchLabel: batchLabel ?? null
        }
      });
    }
  });

  return c.json(
    {
      electionId,
      tokens: created
    },
    201
  );
});

// GET /admin/tokens/:electionId?status=&batch=&page=&limit=
adminTokensApp.get("/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);

  if (!election) {
    return c.json({ error: "Election not found" }, 404);
  }

  const parsedQuery = listTokensQuerySchema.safeParse({
    status: c.req.query("status"),
    batch: c.req.query("batch"),
    page: c.req.query("page"),
    limit: c.req.query("limit")
  });

  if (!parsedQuery.success) {
    return c.json({ error: "Invalid query", details: parsedQuery.error.flatten() }, 400);
  }

  const { status, batch, page, limit } = parsedQuery.data;

  const pageSafe = page && page > 0 ? page : 1;
  const limitSafe = limit && limit > 0 && limit <= 500 ? limit : 50;
  const offset = (pageSafe - 1) * limitSafe;

  const conditions = [eq(tokens.electionId, electionId)];

  if (status) {
    conditions.push(eq(tokens.status, status));
  }

  if (batch) {
    conditions.push(eq(tokens.generatedBatch, batch));
  }

  const whereExpr = and(...conditions);

  const rows = await db
    .select()
    .from(tokens)
    .where(whereExpr)
    .orderBy(asc(tokens.createdAt))
    .limit(limitSafe)
    .offset(offset);

  const [countRow] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(tokens)
    .where(whereExpr);

  const total = Number(countRow?.count ?? 0);

  return c.json({
    election,
    tokens: rows,
    pagination: {
      page: pageSafe,
      limit: limitSafe,
      total
    }
  });
});

// POST /admin/tokens/invalidate/:id
adminTokensApp.post("/invalidate/:id", async (c) => {
  const { id } = c.req.param();

  const [current] = await db.select().from(tokens).where(eq(tokens.id, id)).limit(1);

  if (!current) {
    return c.json({ error: "Token not found" }, 404);
  }

  if (current.status === "USED") {
    return c.json({ error: "Cannot invalidate a used token" }, 400);
  }

  const admin = c.get("admin");

  const [updated] = await db
    .update(tokens)
    .set({
      status: "INVALIDATED",
      invalidatedAt: new Date()
    })
    .where(eq(tokens.id, id))
    .returning();

  if (admin) {
    await db.insert(auditLogs).values({
      adminId: admin.adminId,
      electionId: updated.electionId,
      action: "INVALIDATE_TOKEN",
      metadata: {
        tokenId: updated.id,
        token: updated.token
      }
    });
  }

  return c.json(updated);
});
