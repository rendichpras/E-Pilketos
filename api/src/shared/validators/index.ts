import { z } from "zod";

export const electionStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]);
export const tokenStatusSchema = z.enum(["UNUSED", "USED", "INVALIDATED"]);
export const adminRoleSchema = z.enum(["SUPER_ADMIN", "COMMITTEE"]);

export const createElectionSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .max(64, "Slug maksimal 64 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  name: z.string().min(1, "Nama pemilihan wajib diisi").max(255),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  startAt: z.string().datetime("Format tanggal tidak valid"),
  endAt: z.string().datetime("Format tanggal tidak valid"),
  isResultPublic: z.boolean().optional().default(false)
});

export const updateElectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional()
});

export type CreateElectionInput = z.infer<typeof createElectionSchema>;
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>;

export const createCandidateSchema = z.object({
  number: z.number().int().min(1, "Nomor urut minimal 1"),
  shortName: z.string().min(1, "Nama singkat wajib diisi").max(100),
  ketuaName: z.string().min(1, "Nama ketua wajib diisi").max(100),
  ketuaClass: z.string().min(1, "Kelas ketua wajib diisi").max(50),
  wakilName: z.string().min(1, "Nama wakil wajib diisi").max(100),
  wakilClass: z.string().min(1, "Kelas wakil wajib diisi").max(50),
  photoUrl: z.string().url("URL foto tidak valid").max(255).nullable().optional(),
  vision: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  programs: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true)
});

export const updateCandidateSchema = z.object({
  number: z.number().int().min(1).optional(),
  shortName: z.string().min(1).max(100).optional(),
  ketuaName: z.string().min(1).max(100).optional(),
  ketuaClass: z.string().min(1).max(50).optional(),
  wakilName: z.string().min(1).max(100).optional(),
  wakilClass: z.string().min(1).max(50).optional(),
  photoUrl: z.string().url().max(255).nullable().optional(),
  vision: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  programs: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;

export const generateTokensSchema = z.object({
  count: z
    .number()
    .int()
    .min(1, "Jumlah token minimal 1")
    .max(1000, "Jumlah token maksimal 1000 per batch"),
  batch: z.string().max(128).optional()
});

export type GenerateTokensInput = z.infer<typeof generateTokensSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi").max(64),
  password: z.string().min(1, "Password wajib diisi")
});

export const voterLoginSchema = z.object({
  token: z
    .string()
    .min(1, "Token wajib diisi")
    .transform((v) => v.toUpperCase().trim())
    .pipe(
      z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Format token tidak valid (contoh: ABCD-1234)")
    )
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type VoterLoginInput = z.infer<typeof voterLoginSchema>;

export const voteSchema = z.object({
  candidatePairId: z.string().uuid("ID pasangan calon tidak valid")
});

export type VoteInput = z.infer<typeof voteSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const tokenListQuerySchema = paginationQuerySchema.extend({
  status: tokenStatusSchema.optional(),
  batch: z.string().trim().min(1).max(128).optional(),
  q: z.string().trim().min(1).max(64).optional()
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type TokenListQuery = z.infer<typeof tokenListQuerySchema>;

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
