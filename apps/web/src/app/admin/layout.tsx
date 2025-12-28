"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { adminApi } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { AdminProvider } from "./admin-context";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let cancelled = false;

    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function resolveSession() {
      try {
        const me = await adminApi.me();
        if (!cancelled) {
          setAdmin(me);
        }
      } catch {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    resolveSession();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  async function handleLogout() {
    try {
      await adminApi.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-card/95 w-full max-w-md shadow-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="border-muted-foreground/40 inline-flex h-4 w-4 animate-spin items-center justify-center rounded-full border-2 border-t-transparent" />
              Memuat panel admin
            </CardTitle>
            <CardDescription className="text-xs">
              Memverifikasi sesi admin dan menyiapkan tampilan panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-3/4" />
              <Skeleton className="h-2.5 w-5/6" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-10/12" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminProvider admin={admin}>
      <AdminShell admin={admin} onLogoutAction={handleLogout}>
        {children}
      </AdminShell>
    </AdminProvider>
  );
}
