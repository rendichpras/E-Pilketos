"use client";

import type { CandidatePair, Election } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

type VoteSelectionSummaryProps = {
  candidate: CandidatePair;
  election?: Election | null;
  selectedAt?: string | null;
  title?: string;
};

export function VoteSelectionSummary({
  candidate,
  election,
  selectedAt,
  title = "Ringkasan Pilihan"
}: VoteSelectionSummaryProps) {
  const chosenAt = formatDateTime(selectedAt);

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
              {title}
            </p>
            {election?.name ? (
              <p className="text-muted-foreground mt-1 text-xs">Pemilihan: {election.name}</p>
            ) : null}
          </div>
          <div className="bg-muted text-foreground flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold">
            {candidate.number}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold leading-tight">{candidate.shortName}</p>
          <p className="text-muted-foreground text-sm">
            Ketua: {candidate.ketuaName} • Wakil: {candidate.wakilName}
          </p>
        </div>

        {chosenAt ? (
          <p className="text-muted-foreground text-xs">Dipilih pada {chosenAt}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
