import { ConflictError, BadRequestError } from "./http-error";

interface PgError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
}

type ErrorOptions = {
  resourceName?: string;
  constraintMessages?: Record<string, string>;
};

export function handlePgError(error: unknown, options: ErrorOptions = {}): never {
  const pgErr = error as PgError;
  const { resourceName = "Resource", constraintMessages } = options;

  if (pgErr?.code === "23505") {
    if (constraintMessages && pgErr.constraint && constraintMessages[pgErr.constraint]) {
      throw new ConflictError(constraintMessages[pgErr.constraint]);
    }
    throw new ConflictError(`${resourceName} already exists`);
  }

  if (pgErr?.code === "23503") {
    if (constraintMessages && pgErr.constraint && constraintMessages[pgErr.constraint]) {
      throw new ConflictError(constraintMessages[pgErr.constraint]);
    }
    throw new BadRequestError(`Invalid reference for ${resourceName}`);
  }

  throw error;
}
