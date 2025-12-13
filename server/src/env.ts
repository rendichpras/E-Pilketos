import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  JWT_SECRET_ADMIN: z.string().min(32, "JWT_SECRET_ADMIN minimal 32 karakter"),
  JWT_SECRET_VOTER: z.string().min(32, "JWT_SECRET_VOTER minimal 32 karakter"),
  CORS_ORIGIN: z.string().optional()
});

export const env = envSchema.parse(process.env);
