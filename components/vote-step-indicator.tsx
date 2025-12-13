"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const steps = ["Token", "Surat Suara", "Konfirmasi"] as const;
type StepIndex = 1 | 2 | 3;

export function VoteStepIndicator({ step }: { step: StepIndex }) {
  return (
    <div className="text-muted-foreground space-y-1 text-[11px]">
      <p className="font-mono tracking-[0.20em] uppercase">langkah {step} dari 3</p>

      <div className="border-border/60 bg-muted/30 inline-flex flex-wrap items-center gap-1 rounded-full border px-1.5 py-1">
        {steps.map((label, index) => {
          const isActive = step === index + 1;

          return (
            <Badge
              key={label}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "border-none px-2 py-0 font-mono text-[10px] tracking-[0.18em] uppercase",
                !isActive && "text-foreground/80 bg-transparent"
              )}
            >
              {label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
