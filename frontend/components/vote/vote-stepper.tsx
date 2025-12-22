"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const steps = [
  { key: 1, label: "MASUK TOKEN" },
  { key: 2, label: "PILIH" },
  { key: 3, label: "KONFIRMASI/SUKSES" }
] as const;

export function VoteStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
        langkah {step} dari 3
      </p>

      <div className="bg-muted/30 border-border flex w-fit items-center gap-1 rounded-full border p-1">
        {steps.map((s) => {
          const active = s.key === step;
          const done = s.key < step;

          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
