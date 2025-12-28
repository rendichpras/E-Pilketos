import { type SQL, asc, and, eq, ilike, or, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "../../db/client";
import { elections, tokens, auditLogs, voterSessions } from "../../db/schema";
import { redactInvalidToken } from "../../utils/tokenRedact";

export type TokenStatus = "UNUSED" | "USED" | "INVALIDATED";

export type ListTokensQuery = {
  status?: TokenStatus;
  batch?: string;
  q?: string;
  page: number;
  limit: number;
};

function generateTokenString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  const arr: string[] = [];
  for (let i = 0; i < 8; i++) arr.push(chars[bytes[i] % chars.length]);
  return `${arr.slice(0, 4).join("")}-${arr.slice(4, 8).join("")}`;
}

export const tokenRepository = {
  async findById(id: string) {
    const [row] = await db.select().from(tokens).where(eq(tokens.id, id)).limit(1);
    return row ?? null;
  },

  async findByElection(electionId: string, query: ListTokensQuery) {
    const { status, batch, q, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions: (SQL<unknown> | undefined)[] = [eq(tokens.electionId, electionId)];
    if (status) conditions.push(eq(tokens.status, status));
    if (batch) conditions.push(eq(tokens.generatedBatch, batch));
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(or(ilike(tokens.token, pattern), ilike(tokens.generatedBatch, pattern)));
    }

    const whereExpr = and(...conditions);

    const rows = await db
      .select()
      .from(tokens)
      .where(whereExpr)
      .orderBy(asc(tokens.createdAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tokens)
      .where(whereExpr);

    return {
      tokens: rows,
      total: Number(countRow?.count ?? 0)
    };
  },

  async generate(electionId: string, count: number, batchLabel?: string) {
    return db.transaction(async (tx) => {
      let created = 0;
      const maxAttempts = count * 3;
      let attempts = 0;

      while (created < count && attempts < maxAttempts) {
        const tokenStr = generateTokenString();
        attempts += 1;
        try {
          await tx.insert(tokens).values({
            electionId,
            token: tokenStr,
            generatedBatch: batchLabel
          });
          created += 1;
        } catch (e: unknown) {
          const pgErr = e as { code?: string; constraint?: string };
          if (pgErr?.code === "23505" && pgErr?.constraint === "tokens_election_token_unique") {
            continue;
          }
          throw e;
        }
      }

      if (created < count) {
        throw new Error(
          `Hanya berhasil membuat ${created} dari ${count} token setelah ${maxAttempts} percobaan`
        );
      }

      return created;
    });
  },

  async invalidate(id: string) {
    const now = new Date();
    const [updated] = await db
      .update(tokens)
      .set({
        status: "INVALIDATED",
        invalidatedAt: now,
        token: redactInvalidToken(id)
      })
      .where(eq(tokens.id, id))
      .returning();

    await db.delete(voterSessions).where(eq(voterSessions.tokenId, id));

    return updated ?? null;
  }
};

export const electionForToken = {
  async findById(id: string) {
    const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    return row ?? null;
  }
};

export async function logTokenAudit(
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
