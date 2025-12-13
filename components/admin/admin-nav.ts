import { LayoutDashboard, FolderKanban, Users2, KeySquare, BarChart3 } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  keywords: string[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "ringkasan", "home"]
  },
  {
    href: "/admin/elections",
    label: "Pemilihan",
    icon: FolderKanban,
    keywords: ["pemilihan", "election", "jadwal", "periode"]
  },
  {
    href: "/admin/candidates",
    label: "Kandidat",
    icon: Users2,
    keywords: ["kandidat", "paslon", "calon", "ketua", "wakil"]
  },
  {
    href: "/admin/tokens",
    label: "Token",
    icon: KeySquare,
    keywords: ["token", "kode", "pemilih", "generate", "batch"]
  },
  {
    href: "/admin/results",
    label: "Hasil",
    icon: BarChart3,
    keywords: ["hasil", "rekap", "suara", "statistik"]
  }
];

export function getAdminNavItemByPath(pathname: string) {
  return adminNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
}
