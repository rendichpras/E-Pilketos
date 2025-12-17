const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

function normalizeApiBase(base: string) {
  const clean = base.replace(/\/+$/, "");
  return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
}

export const API_BASE_URL = raw ? normalizeApiBase(raw) : "/api/v1";
