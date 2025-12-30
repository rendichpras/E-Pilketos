"use client";

import type { AdminUser } from "@/shared/types";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Search, LogOut } from "lucide-react";

type AdminTopbarProps = {
  admin: AdminUser;
  onOpenCommand: () => void;
  onLogoutAction: () => void;
};

function initials(username: string) {
  const clean = username.trim();
  if (!clean) return "A";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

export function AdminTopbar({ admin, onOpenCommand, onLogoutAction }: AdminTopbarProps) {
  return (
    <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />

      <div className="min-w-0 flex-1">
        <AdminBreadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-border/60 bg-background/60 hidden h-9 items-center gap-2 rounded-full px-3 text-xs font-medium shadow-sm md:flex"
          onClick={onOpenCommand}
        >
          <Search className="h-4 w-4" />
          <span className="text-muted-foreground">Cari menu...</span>
          <kbd className="border-border/70 bg-background text-muted-foreground ml-2 inline-flex h-5 items-center rounded-full border px-2 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-border/60 bg-background/60 h-9 w-9 rounded-full shadow-sm md:hidden"
          onClick={onOpenCommand}
          aria-label="Cari"
        >
          <Search className="h-4 w-4" />
        </Button>

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-border/60 bg-background/60 h-9 w-9 rounded-full shadow-sm"
              aria-label="Menu akun"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[10px] font-semibold">
                  {initials(admin.username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <div className="text-sm font-semibold">{admin.username}</div>
              <div className="text-muted-foreground text-xs">
                {admin.role === "SUPER_ADMIN" ? "Super admin" : "Panitia"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onLogoutAction}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
