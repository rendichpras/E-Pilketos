export const ERROR_MESSAGES: Record<string, string> = {
  TOKEN_USED: "Token sudah digunakan",
  TOKEN_INVALID: "Token tidak valid",
  TOKEN_AMBIGUOUS: "Token ambigu, hubungi panitia",
  ELECTION_INACTIVE: "Pemilihan tidak aktif",
  SESSION_EXPIRED: "Sesi telah berakhir, silakan login ulang",
  UNAUTHORIZED: "Tidak terautentikasi",
  FORBIDDEN: "Akses ditolak",
  NOT_FOUND: "Data tidak ditemukan",
  VALIDATION_ERROR: "Data tidak valid",
  CONFLICT: "Konflik data",
  INVALID_CANDIDATE: "Pasangan calon tidak valid",
  ALREADY_VOTED: "Anda sudah memberikan suara",
  ELECTION_NOT_STARTED: "Pemilihan belum dimulai",
  ELECTION_ENDED: "Pemilihan sudah berakhir",
  RATE_LIMIT: "Terlalu banyak permintaan, coba lagi nanti"
};

export function getErrorMessage(code?: string, fallback = "Terjadi kesalahan"): string {
  if (!code) return fallback;
  return ERROR_MESSAGES[code] ?? fallback;
}

export function isKnownErrorCode(code?: string): boolean {
  return code ? code in ERROR_MESSAGES : false;
}
