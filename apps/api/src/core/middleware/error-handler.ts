import type { Context } from "hono";
import type { AppEnv } from "../../app-env";
import { isHttpError } from "../errors";

type PgErr = {
  code?: string;
  constraint?: string;
  detail?: string;
};

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500;

function pickStatusFromPg(e: PgErr): ErrorStatus {
  if (e.code === "23505") return 409; // unique_violation
  if (e.code === "23503") return 409; // foreign_key_violation
  if (e.code === "23514") return 400; // check_violation
  if (e.code === "22P02") return 400; // invalid_text_representation
  return 500;
}

function safeMessage(status: ErrorStatus): string {
  switch (status) {
    case 400:
      return "Input tidak valid.";
    case 401:
      return "Tidak terautentikasi.";
    case 403:
      return "Akses ditolak.";
    case 404:
      return "Resource tidak ditemukan.";
    case 409:
      return "Konflik data (duplikat / constraint).";
    case 429:
      return "Terlalu banyak permintaan.";
    default:
      return "Terjadi kesalahan internal.";
  }
}

export function onError(err: unknown, c: Context<AppEnv>): Response {
  const requestId = c.get("requestId");

  if (isHttpError(err)) {
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        type: err.name,
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        path: c.req.path,
        method: c.req.method
      })
    );

    return c.json(
      {
        ok: false as const,
        error: err.message,
        code: err.code,
        details: err.details,
        requestId
      },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500
    );
  }

  const zodErr = err as { name?: string; issues?: unknown[] };
  if (zodErr?.name === "ZodError" && Array.isArray(zodErr.issues)) {
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        type: "ZodError",
        issues: zodErr.issues,
        path: c.req.path,
        method: c.req.method
      })
    );

    return c.json(
      {
        ok: false,
        error: "Validasi gagal",
        code: "VALIDATION_ERROR",
        details: zodErr.issues,
        requestId
      },
      400
    );
  }

  const pgErr = err as PgErr;
  const status: ErrorStatus = pgErr?.code ? pickStatusFromPg(pgErr) : 500;

  console.error(
    JSON.stringify(
      {
        level: "error",
        requestId,
        message: (err as Error)?.message ?? String(err),
        stack: (err as Error)?.stack,
        pg: pgErr?.code
          ? {
              code: pgErr.code,
              constraint: pgErr.constraint,
              detail: pgErr.detail
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
      ok: false,
      error: safeMessage(status),
      requestId
    },
    status
  );
}
