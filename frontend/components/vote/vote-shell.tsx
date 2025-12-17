"use client";

import { cn } from "@/lib/cn";

export function VoteShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-background text-foreground min-h-screen", className)}>
      <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">{children}</div>
    </div>
  );
}
