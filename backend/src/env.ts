import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),

    CORS_ORIGIN: z.string().optional(),

    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAMESITE: z
      .preprocess(
        (v) => {
          if (typeof v !== "string") return v;
          const s = v.trim().toLowerCase();
          if (s === "lax") return "Lax";
          if (s === "strict") return "Strict";
          if (s === "none") return "None";
          return v;
        },
        z.enum(["Lax", "Strict", "None"])
      )
      .default("Lax"),
    COOKIE_SECURE: z.coerce.boolean().optional(),

    ADMIN_SESSION_TTL_SEC: z.coerce
      .number()
      .int()
      .min(300)
      .max(7 * 24 * 3600)
      .default(8 * 3600),
    VOTER_SESSION_TTL_SEC: z.coerce
      .number()
      .int()
      .min(300)
      .max(24 * 3600)
      .default(2 * 3600),

    REDIS_URL: z.string().optional(),
    RATE_LIMIT_REDIS_PREFIX: z.string().min(1).default("e-pilketos:rl"),

    RATE_LIMIT_LOGIN_WINDOW_SEC: z.coerce.number().int().min(5).max(3600).default(60),
    RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().min(1).max(1000).default(10),
    RATE_LIMIT_TOKEN_LOGIN_WINDOW_SEC: z.coerce.number().int().min(5).max(3600).default(60),
    RATE_LIMIT_TOKEN_LOGIN_MAX: z.coerce.number().int().min(1).max(1000).default(20),
    RATE_LIMIT_VOTE_WINDOW_SEC: z.coerce.number().int().min(5).max(3600).default(30),
    RATE_LIMIT_VOTE_MAX: z.coerce.number().int().min(1).max(1000).default(5)
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production") {
      if (!val.CORS_ORIGIN || val.CORS_ORIGIN.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message: "CORS_ORIGIN wajib diisi di production (isi domain frontend)"
        });
      }

      if (val.CORS_ORIGIN?.trim() === "*") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message: "CORS_ORIGIN tidak boleh '*' di production"
        });
      }

      const secure = val.COOKIE_SECURE ?? true;
      if (val.COOKIE_SAMESITE === "None" && !secure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["COOKIE_SECURE"],
          message: "COOKIE_SECURE wajib true jika COOKIE_SAMESITE=None"
        });
      }

      if (!val.REDIS_URL || val.REDIS_URL.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["REDIS_URL"],
          message: "REDIS_URL wajib di production (rate limit multi-instance)"
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
