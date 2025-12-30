export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return normalize(text).includes(normalize(query));
}
