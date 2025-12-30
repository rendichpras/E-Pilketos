"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { AdminUser } from "@/lib/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminCommand } from "@/components/admin/admin-command";

type AdminShellProps = {
  admin: AdminUser;
  onLogoutAction: () => void;
  children: ReactNode;
};

export function AdminShell({ admin, onLogoutAction, children }: AdminShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <SidebarProvider className="bg-background text-foreground">
      <AdminSidebar admin={admin} onLogoutAction={onLogoutAction} />

      <SidebarInset className="flex min-h-screen flex-col">
        <AdminTopbar
          admin={admin}
          onOpenCommand={() => setCommandOpen(true)}
          onLogoutAction={onLogoutAction}
        />

        <main className="flex w-full flex-1 flex-col px-4 py-6 md:px-6 md:py-8">{children}</main>

        <AdminCommand
          admin={admin}
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onLogoutAction={onLogoutAction}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
