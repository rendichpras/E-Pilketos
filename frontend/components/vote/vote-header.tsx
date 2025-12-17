"use client";

import { VoteStepper } from "@/components/vote/vote-stepper";
import { ElectionInfo } from "@/components/vote/election-info";

export function VoteHeader({
  step,
  eyebrow,
  title,
  description,
  electionName,
  electionRange
}: {
  step: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  description?: string;
  electionName?: string | null;
  electionRange?: string | null;
}) {
  return (
    <section className="space-y-4">
      <VoteStepper step={step} />

      <div className="space-y-2">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
          {eyebrow}
        </p>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base">{description}</p>
          ) : null}

          <ElectionInfo name={electionName ?? null} range={electionRange ?? null} />
        </div>
      </div>
    </section>
  );
}
