"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser } from "@/shared/types";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

import { adminNavItems } from "@/components/admin/admin-nav";

type AdminCommandProps = {
  admin: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoutAction: () => void;
};

export function AdminCommand({ admin, open, onOpenChange, onLogoutAction }: AdminCommandProps) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const roleLabel = admin.role === "SUPER_ADMIN" ? "Super admin" : "Panitia";

  const navItems = useMemo(() => {
    return adminNavItems.map((item) => ({
      ...item,
      search: [item.label, ...item.keywords].join(" ").toLowerCase()
    }));
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pencarian"
      description="Cari menu admin dan jalankan aksi cepat."
      className="max-w-xl"
    >
      <CommandInput placeholder="Ketik untuk mencari..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>

        <CommandGroup heading="Navigasi">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <CommandItem
                key={item.href}
                value={item.search}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(item.href);
                }}
              >
                <Icon className="text-muted-foreground size-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aksi">
          <CommandItem
            value="logout keluar"
            onSelect={() => {
              onOpenChange(false);
              onLogoutAction();
            }}
          >
            <span>Keluar</span>
          </CommandItem>

          <CommandItem value={`akun ${admin.username} ${roleLabel}`} disabled className="gap-2">
            <span className="text-muted-foreground">Akun</span>
            <span className="font-medium">{admin.username}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {roleLabel}
            </Badge>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
