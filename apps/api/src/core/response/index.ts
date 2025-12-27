import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

export function success<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ ok: true as const, data }, status);
}

export function created<T>(c: Context, data: T) {
  return c.json({ ok: true as const, data }, 201);
}

export function noContent(c: Context) {
  return c.json({ ok: true as const }, 200);
}

export function paginated<T>(c: Context, data: T[], pagination: Omit<Pagination, "totalPages">) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return c.json({
    ok: true as const,
    data,
    pagination: {
      ...pagination,
      totalPages
    }
  });
}

export function error(
  c: Context,
  statusCode: ErrorStatus,
  message: string,
  code?: string,
  details?: unknown
) {
  const requestId = c.get("requestId");

  return c.json(
    {
      ok: false as const,
      error: message,
      code,
      details,
      requestId
    },
    statusCode
  );
}

export function validationError(c: Context, details: unknown) {
  return error(c, 400, "Validasi gagal", "VALIDATION_ERROR", details);
}
