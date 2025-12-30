export type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/#kandidat", label: "Kandidat" },
  { href: "/hasil", label: "Hasil" },
  { href: "/vote", label: "Mulai Memilih" }
] as const;

export const ADMIN_NAV_LINKS: readonly NavLink[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/elections", label: "Pemilihan" },
  { href: "/admin/candidates", label: "Kandidat" },
  { href: "/admin/tokens", label: "Token" },
  { href: "/admin/results", label: "Hasil" }
] as const;
