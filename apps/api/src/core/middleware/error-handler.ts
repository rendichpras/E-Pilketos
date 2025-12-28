import type { Context } from "hono";
import type { AppEnv } from "../../app-env";
import { isHttpError } from "../errors";
import { ERROR_CODES, type ErrorCode } from "@e-pilketos/types";
import { logger } from "../logger";

type PgErr = {
  code?: string;
  constraint?: string;
  detail?: string;
};

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500;

function pickStatusFromPg(e: PgErr): ErrorStatus {
  if (e.code === "23505") return 409;
  if (e.code === "23503") return 409;
  if (e.code === "23514") return 400;
  if (e.code === "22P02") return 400;
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

function safeCode(status: ErrorStatus): ErrorCode {
  switch (status) {
    case 400:
      return ERROR_CODES.BAD_REQUEST;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 429:
      return ERROR_CODES.TOO_MANY_REQUESTS;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}
export function onError(err: unknown, c: Context<AppEnv>): Response {
  const requestId = c.get("requestId");

  if (isHttpError(err)) {
    logger.error(
      {
        requestId,
        type: err.name,
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        path: c.req.path,
        method: c.req.method
      },
      "HttpError"
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
    logger.error(
      {
        requestId,
        type: "ZodError",
        issues: zodErr.issues,
        path: c.req.path,
        method: c.req.method
      },
      "ZodError"
    );

    return c.json(
      {
        ok: false,
        error: "Validasi gagal",
        code: ERROR_CODES.VALIDATION_ERROR,
        details: zodErr.issues,
        requestId
      },
      400
    );
  }

  const pgErr = err as PgErr;
  const status: ErrorStatus = pgErr?.code ? pickStatusFromPg(pgErr) : 500;

  logger.error(
    {
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
    "UnhandledError"
  );

  return c.json(
    {
      ok: false,
      error: safeMessage(status),
      code: safeCode(status),
      requestId
    },
    status
  );
}
