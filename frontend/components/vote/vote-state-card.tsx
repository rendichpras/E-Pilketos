"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type VoteStateCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  tone?: "default" | "destructive";
  actions?: ReactNode;
  className?: string;
};

export function VoteStateCard({
  eyebrow = "STATUS",
  title,
  description,
  tone = "default",
  actions,
  className
}: VoteStateCardProps) {
  return (
    <Card
      className={cn(
        "border-border/80 bg-card/95 shadow-sm",
        tone === "destructive" && "border-destructive/40",
        className
      )}
    >
      <CardContent className="space-y-5 py-8 text-center">
        <div className="bg-muted/40 mx-auto inline-flex items-center rounded-full border px-3 py-1">
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase">{eyebrow}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>

        {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
