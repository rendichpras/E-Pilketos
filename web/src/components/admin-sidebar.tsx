"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

import type { AdminUser } from "@/shared/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";
import { adminNavItems } from "@/components/admin/admin-nav";

type AdminSidebarProps = {
  admin: AdminUser;
  onLogoutAction: () => void;
};

export function AdminSidebar({ admin, onLogoutAction }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-sidebar-border/60 border-b px-3 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-osis.png"
            alt="Logo OSIS"
            width={32}
            height={32}
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
          <div className="flex flex-col">
            <span className="text-sm leading-tight font-semibold">E-Pilketos</span>
            <span className="text-muted-foreground text-[11px]">Panel admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-3 text-[11px] font-medium tracking-[0.18em] uppercase">
            Navigasi
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/60 border-t px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs">
              <div className="flex flex-col">
                <span className="leading-tight font-medium">{admin.username}</span>
                <span className="text-muted-foreground text-[11px]">
                  {admin.role === "SUPER_ADMIN" ? "Super admin" : "Panitia"}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-medium"
              onClick={onLogoutAction}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
