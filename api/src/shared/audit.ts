import { db } from "../db/client";
import { auditLogs } from "../db/schema";

export async function logAudit(
  adminId: string,
  electionId: string | null,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.insert(auditLogs).values({
    adminId,
    electionId,
    action,
    metadata: metadata ?? null
  });
}
