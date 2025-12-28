import type { ErrorCode } from "@e-pilketos/types";

export interface ApiErrorPayload {
  error?: string;
  code?: ErrorCode | string;
  details?: unknown;
  requestId?: string;
}

function isApiErrorPayload(data: unknown): data is ApiErrorPayload {
  return typeof data === "object" && data !== null;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: ErrorCode;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(args: {
    message: string;
    status: number;
    code?: ErrorCode;
    details?: unknown;
    requestId?: string;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.requestId = args.requestId;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const payload = isApiErrorPayload(data) ? data : {};

    throw new ApiError({
      message: payload.error ?? `Request failed with status ${res.status}`,
      status: res.status,
      code: typeof payload.code === "string" ? (payload.code as ErrorCode) : undefined,
      details: payload.details,
      requestId: payload.requestId
    });
  }

  if (
    data &&
    typeof data === "object" &&
    "ok" in data &&
    (data as { ok: boolean }).ok === true &&
    "data" in data
  ) {
    return (data as { data: T }).data;
  }

  return data as T;
}
