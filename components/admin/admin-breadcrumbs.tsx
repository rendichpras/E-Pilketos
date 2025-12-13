"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { getAdminNavItemByPath } from "@/components/admin/admin-nav";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  elections: "Pemilihan",
  candidates: "Kandidat",
  tokens: "Token",
  results: "Hasil",
  login: "Login",
  print: "Cetak"
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  const activeNav = getAdminNavItemByPath(pathname);
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  if (segments[0] === "admin") {
    crumbs.push({ label: "Admin", href: "/admin/dashboard" });
  }

  if (activeNav) {
    crumbs.push({ label: activeNav.label });
  } else {
    for (let i = 1; i < segments.length; i += 1) {
      const seg = segments[i];
      const label = segmentLabels[seg] ?? seg;
      const href = "/" + segments.slice(0, i + 1).join("/");
      crumbs.push({ label, href: i === segments.length - 1 ? undefined : href });
    }
  }

  const deduped = crumbs.filter((c, idx) => idx === 0 || c.label !== crumbs[idx - 1]?.label);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap">
        {deduped.map((crumb, idx) => {
          const isLast = idx === deduped.length - 1;

          return (
            <BreadcrumbItem key={`${crumb.label}-${idx}`} className="min-w-0">
              {idx > 0 ? <BreadcrumbSeparator /> : null}

              {isLast || !crumb.href ? (
                <BreadcrumbPage className="max-w-[180px] truncate sm:max-w-none">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="max-w-[140px] truncate sm:max-w-none">
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
