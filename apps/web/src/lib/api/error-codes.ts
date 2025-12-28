import type { ErrorCode } from "@e-pilketos/types";

export const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  TOKEN_USED: "Token sudah digunakan",
  TOKEN_INVALID: "Token tidak valid",
  TOKEN_AMBIGUOUS: "Token ambigu, hubungi panitia",
  ELECTION_INACTIVE: "Pemilihan tidak aktif atau di luar jadwal",
  SESSION_EXPIRED: "Sesi telah berakhir, silakan login ulang",

  UNAUTHORIZED: "Tidak terautentikasi",
  FORBIDDEN: "Akses ditolak",
  NOT_FOUND: "Data tidak ditemukan",
  VALIDATION_ERROR: "Data tidak valid",
  BAD_REQUEST: "Input tidak valid",
  CONFLICT: "Konflik data",
  TOO_MANY_REQUESTS: "Terlalu banyak permintaan, coba lagi nanti",
  INTERNAL_ERROR: "Terjadi kesalahan internal",

  CANDIDATE_INVALID: "Pasangan calon tidak valid"
};

export function getErrorMessage(code?: ErrorCode, fallback = "Terjadi kesalahan"): string {
  if (!code) return fallback;
  return ERROR_MESSAGES[code] ?? fallback;
}

export function isKnownErrorCode(code?: string): code is ErrorCode {
  return Boolean(code && (code as ErrorCode) in ERROR_MESSAGES);
}
