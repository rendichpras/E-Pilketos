"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { AdminUser } from "@/lib/types";
import { AdminProvider } from "@/features/admin/session/admin-context";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi } from "@/lib/api";

type AdminClientWrapperProps = {
  admin: AdminUser;
  children: ReactNode;
};

export function AdminClientWrapper({ admin, children }: AdminClientWrapperProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await adminApi.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <AdminProvider admin={admin}>
      <AdminShell admin={admin} onLogoutAction={handleLogout}>
        {children}
      </AdminShell>
    </AdminProvider>
  );
}
