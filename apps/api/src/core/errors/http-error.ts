export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code ?? "ERROR";
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code = "BAD_REQUEST", details?: unknown) {
    super(400, message, code, details);
    this.name = "BadRequestError";
  }
}

export class ValidationError extends HttpError {
  constructor(details: unknown) {
    super(400, "Validasi gagal", "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Tidak terautentikasi") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Akses ditolak") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(404, `${resource} tidak ditemukan`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, code = "CONFLICT") {
    super(409, message, code);
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = "Terlalu banyak permintaan. Coba lagi nanti.") {
    super(429, message, "TOO_MANY_REQUESTS");
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "Terjadi kesalahan internal") {
    super(500, message, "INTERNAL_ERROR");
    this.name = "InternalServerError";
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
