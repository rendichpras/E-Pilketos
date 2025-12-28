import { describe, it, expect } from "vitest";
import {
  HttpError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  isHttpError
} from "./http-error";

describe("HttpError", () => {
  it("creates error with correct properties", () => {
    const error = new HttpError(400, "Test error", "TEST_CODE", { field: "value" });

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.details).toEqual({ field: "value" });
    expect(error.name).toBe("HttpError");
  });

  it("defaults code to ERROR if not provided", () => {
    const error = new HttpError(500, "Test error");
    expect(error.code).toBe("ERROR");
  });

  it("extends Error", () => {
    const error = new HttpError(400, "Test");
    expect(error instanceof Error).toBe(true);
  });
});

describe("BadRequestError", () => {
  it("has status 400", () => {
    const error = new BadRequestError("Bad request");
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe("BadRequestError");
  });

  it("uses custom code if provided", () => {
    const error = new BadRequestError("Bad request", "CUSTOM_CODE");
    expect(error.code).toBe("CUSTOM_CODE");
  });
});

describe("ValidationError", () => {
  it("has status 400 and VALIDATION_ERROR code", () => {
    const details = { field: ["error message"] };
    const error = new ValidationError(details);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual(details);
    expect(error.message).toBe("Validasi gagal");
  });
});

describe("UnauthorizedError", () => {
  it("has status 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Tidak terautentikasi");
  });

  it("uses custom message if provided", () => {
    const error = new UnauthorizedError("Custom message");
    expect(error.message).toBe("Custom message");
  });
});

describe("ForbiddenError", () => {
  it("has status 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Akses ditolak");
  });
});

describe("NotFoundError", () => {
  it("has status 404 with resource name", () => {
    const error = new NotFoundError("User");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("User tidak ditemukan");
  });
});

describe("ConflictError", () => {
  it("has status 409", () => {
    const error = new ConflictError("Already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("uses custom code if provided", () => {
    const error = new ConflictError("Already exists", "DUPLICATE");
    expect(error.code).toBe("DUPLICATE");
  });
});

describe("TooManyRequestsError", () => {
  it("has status 429", () => {
    const error = new TooManyRequestsError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("TOO_MANY_REQUESTS");
  });
});

describe("InternalServerError", () => {
  it("has status 500", () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });
});

describe("isHttpError", () => {
  it("returns true for HttpError instances", () => {
    expect(isHttpError(new HttpError(400, "test"))).toBe(true);
    expect(isHttpError(new BadRequestError("test"))).toBe(true);
    expect(isHttpError(new NotFoundError("User"))).toBe(true);
  });

  it("returns false for non-HttpError", () => {
    expect(isHttpError(new Error("test"))).toBe(false);
    expect(isHttpError({ message: "test" })).toBe(false);
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
  });
});
