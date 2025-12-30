import { cn } from "./cn";
import type { ElectionStatus, TokenStatus } from "@/shared/types";

export function electionStatusBadge(status: ElectionStatus) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    status === "ACTIVE" && "border-primary/40 bg-primary/10 text-primary",
    status === "CLOSED" && "border-destructive/40 bg-destructive/10 text-destructive",
    status === "DRAFT" && "bg-muted text-foreground/80 border-dashed",
    status === "ARCHIVED" && "border-border bg-muted/60 text-muted-foreground"
  );
}

export function tokenStatusBadge(status: TokenStatus) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    status === "UNUSED" && "border-primary/40 bg-primary/10 text-primary",
    status === "USED" && "border-muted-foreground/40 bg-muted text-muted-foreground",
    status === "INVALIDATED" && "border-destructive/40 bg-destructive/10 text-destructive"
  );
}

export function activeBadge(isActive: boolean) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    isActive
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-destructive/40 bg-destructive/10 text-destructive"
  );
}

export function resultPublicBadge(isPublic: boolean) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    isPublic
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-border bg-muted text-muted-foreground"
  );
}
