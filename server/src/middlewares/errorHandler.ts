import type { Context } from "hono";
import type { AppEnv } from "../app-env";

type PgErr = {
  code?: string;
  constraint?: string;
  detail?: string;
};

function pickStatusFromPg(e: PgErr): number {
  // Postgres SQLSTATE
  if (e.code === "23505") return 409; // unique_violation
  if (e.code === "23503") return 409; // foreign_key_violation
  if (e.code === "23514") return 400; // check_violation
  if (e.code === "22P02") return 400; // invalid_text_representation (uuid, int, etc)
  return 500;
}

function safeMessage(status: number, e: PgErr): string {
  if (status === 409) return "Konflik data (duplikat / constraint).";
  if (status === 400) return "Input tidak valid.";
  return "Terjadi kesalahan internal.";
}

export function onError(err: unknown, c: Context<AppEnv>): Response {
  const requestId = c.get("requestId");
  const e = err as PgErr;

  const status = e?.code ? pickStatusFromPg(e) : 500;

  console.error(
    JSON.stringify(
      {
        level: "error",
        requestId,
        message: (err as any)?.message ?? String(err),
        pg: e?.code
          ? {
              code: e.code,
              constraint: e.constraint,
              detail: e.detail
            }
          : null,
        path: c.req.path,
        method: c.req.method
      },
      null,
      2
    )
  );

  return c.json(
    {
      error: safeMessage(status, e),
      requestId
    },
    status
  );
}
