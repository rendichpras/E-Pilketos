"use client";

import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3 } from "lucide-react";

export function ElectionInfo({ name, range }: { name?: string | null; range?: string | null }) {
  if (!name && !range) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {name ? (
        <Badge variant="secondary" className="gap-2 text-xs">
          <CalendarDays className="h-4 w-4" />
          <span className="leading-tight">{name}</span>
        </Badge>
      ) : null}

      {range ? (
        <Badge
          variant="outline"
          className="gap-2 font-mono text-[11px] tracking-[0.16em] uppercase"
        >
          <Clock3 className="h-4 w-4" />
          <span className="leading-tight">{range}</span>
        </Badge>
      ) : null}
    </div>
  );
}
