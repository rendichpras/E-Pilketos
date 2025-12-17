import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { AppEnv } from "../../app-env";
import { db } from "../../db/client";
import { elections, tokens, auditLogs, voterSessions } from "../../db/schema";
import { adminAuth } from "../../middlewares/adminAuth";
import { requireRole } from "../../middlewares/requireRole";
import { redactInvalidToken } from "../../utils/tokenRedact";

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
  for (let i = 0; i < 8; i++) arr.push(chars[bytes[i] % chars.length]);
  return `${arr.slice(0, 4).join("")}-${arr.slice(4, 8).join("")}`;
}

export const adminTokensApp = new Hono<AppEnv>();
adminTokensApp.use("/*", adminAuth);

adminTokensApp.post("/generate/:electionId", requireRole("SUPER_ADMIN"), async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) {
    return c.json({ error: "Election not found" }, 404);
  }

  if (election.status !== "DRAFT") {
    return c.json({ error: "Token hanya bisa dibuat saat election masih DRAFT" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = generateTokensSchema.safeParse(body);
  if (!parsed.success)
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

  const { count, batchLabel } = parsed.data;
  const admin = c.get("admin");

  await db.transaction(async (tx) => {
    let created = 0;
    while (created < count) {
      const tokenStr = generateTokenString();
      try {
        await tx.insert(tokens).values({
          electionId,
          token: tokenStr,
          generatedBatch: batchLabel
        });
        created += 1;
      } catch (e: unknown) {
        const pgErr = e as { code?: string; constraint?: string };
        if (pgErr?.code === "23505" && pgErr?.constraint === "tokens_election_token_unique")
          continue;
        throw e;
      }
    }

    if (admin) {
      await tx.insert(auditLogs).values({
        adminId: admin.adminId,
        electionId,
        action: "GENERATE_TOKENS",
        metadata: { count, batchLabel: batchLabel ?? null }
      });
    }
  });

  return c.json({ electionId, createdCount: count, batchLabel: batchLabel ?? null }, 201);
});

adminTokensApp.get("/:electionId", async (c) => {
  const { electionId } = c.req.param();

  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) return c.json({ error: "Election not found" }, 404);

  const parsedQuery = listTokensQuerySchema.safeParse({
    status: c.req.query("status"),
    batch: c.req.query("batch"),
    page: c.req.query("page"),
    limit: c.req.query("limit")
  });

  if (!parsedQuery.success)
    return c.json({ error: "Invalid query", details: parsedQuery.error.flatten() }, 400);

  const { status, batch, page, limit } = parsedQuery.data;

  const pageSafe = page && page > 0 ? page : 1;
  const limitSafe = limit && limit > 0 && limit <= 500 ? limit : 50;
  const offset = (pageSafe - 1) * limitSafe;

  const conditions = [eq(tokens.electionId, electionId)];
  if (status) conditions.push(eq(tokens.status, status));
  if (batch) conditions.push(eq(tokens.generatedBatch, batch));

  const whereExpr = and(...conditions);

  const rows = await db
    .select()
    .from(tokens)
    .where(whereExpr)
    .orderBy(asc(tokens.createdAt))
    .limit(limitSafe)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tokens)
    .where(whereExpr);

  return c.json({
    election,
    tokens: rows,
    pagination: { page: pageSafe, limit: limitSafe, total: Number(countRow?.count ?? 0) }
  });
});

adminTokensApp.post("/invalidate/:id", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();

  const [current] = await db.select().from(tokens).where(eq(tokens.id, id)).limit(1);
  if (!current) return c.json({ error: "Token not found" }, 404);
  if (current.status === "USED") return c.json({ error: "Cannot invalidate a used token" }, 400);

  const [election] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, current.electionId))
    .limit(1);

  if (!election) return c.json({ error: "Election not found" }, 404);

  if (election.status !== "DRAFT") {
    return c.json({ error: "Token hanya bisa di-invalidate saat election masih DRAFT" }, 400);
  }

  const admin = c.get("admin");
  const now = new Date();

  const [updated] = await db.transaction(async (tx) => {
    const [t] = await tx
      .update(tokens)
      .set({
        status: "INVALIDATED",
        invalidatedAt: now,
        token: redactInvalidToken(id)
      })
      .where(eq(tokens.id, id))
      .returning();

    await tx.delete(voterSessions).where(eq(voterSessions.tokenId, id));

    if (admin) {
      await tx.insert(auditLogs).values({
        adminId: admin.adminId,
        electionId: t.electionId,
        action: "INVALIDATE_TOKEN",
        metadata: { tokenId: t.id }
      });
    }

    return [t] as const;
  });

  return c.json(updated);
});
