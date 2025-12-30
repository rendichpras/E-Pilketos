import type { Context } from "hono";
import type { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors";

export async function validateBody<T>(c: Context, schema: ZodSchema<T>): Promise<T> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return result.data;
}

export function validateQuery<T>(c: Context, schema: ZodSchema<T>): T {
  const query = c.req.query();
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return result.data;
}

export function validateParams<T>(c: Context, schema: ZodSchema<T>): T {
  const params = c.req.param();
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return result.data;
}

export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError } {
  return schema.safeParse(data) as any;
}
