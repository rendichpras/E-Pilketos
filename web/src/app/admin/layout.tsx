import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { serverGet } from "@/lib/api/server";
import type { AdminUser } from "@/shared/types";
import { AdminClientWrapper } from "./admin-client-wrapper";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  const isLoginPage = pathname.includes("/admin/login");

  if (isLoginPage) {
    return <>{children}</>;
  }

  let admin: AdminUser | null = null;

  try {
    admin = await serverGet<AdminUser>("/admin/auth/me", { cache: "no-store" });
  } catch {
    redirect("/admin/login");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminClientWrapper admin={admin}>{children}</AdminClientWrapper>;
}
