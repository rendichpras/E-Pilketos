import Link from "next/link";
import type { CandidatePair } from "@/shared/types";

import { CandidatePhoto, CandidateInfo, CandidateDrawer } from "@/components/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ListOrdered } from "lucide-react";

type CandidatesSectionProps = {
  electionName: string | null;
  candidates: CandidatePair[];
  voteEnabled: boolean;
  voteDisabledLabel: string;
};

function CandidateCardItem({
  electionName,
  candidate,
  voteEnabled,
  voteDisabledLabel
}: {
  electionName: string | null;
  candidate: CandidatePair;
  voteEnabled: boolean;
  voteDisabledLabel: string;
}) {
  const title = candidate.shortName || `Paslon ${candidate.number}`;

  const drawerActions = voteEnabled ? (
    <Button asChild className="w-full sm:w-auto">
      <Link href="/vote">Masuk Bilik Suara</Link>
    </Button>
  ) : (
    <Button variant="secondary" disabled title={voteDisabledLabel} className="w-full sm:w-auto">
      {voteDisabledLabel}
    </Button>
  );

  return (
    <Card className="border-border/80 bg-card/95 flex h-full flex-col overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <CandidatePhoto
          photoUrl={candidate.photoUrl}
          name={title}
          className="rounded-none border-0"
        />
      </CardContent>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="mt-1">
              <CandidateInfo
                ketuaName={candidate.ketuaName}
                ketuaClass={candidate.ketuaClass}
                wakilName={candidate.wakilName}
                wakilClass={candidate.wakilClass}
              />
            </CardDescription>
          </div>

          <Badge variant="outline" className="shrink-0 text-[11px]">
            #{candidate.number}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="text-muted-foreground min-h-[40px] text-sm">
          Lihat visi, misi, dan program lewat tombol Detail.
        </p>
      </CardContent>

      <CardFooter className="mt-auto w-full justify-end gap-2 border-t">
        <CandidateDrawer
          candidate={candidate}
          electionName={electionName}
          actions={drawerActions}
        />

        {voteEnabled ? (
          <Button asChild size="sm" className="min-w-[64px]">
            <Link href="/vote">Pilih</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled
            title={voteDisabledLabel}
            className="min-w-[64px]"
          >
            Pilih
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function CandidatesSection({
  electionName,
  candidates,
  voteEnabled,
  voteDisabledLabel
}: CandidatesSectionProps) {
  const hasCandidates = candidates.length > 0;

  return (
    <section id="kandidat" className="scroll-mt-24 border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Paslon</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {electionName ?? "Daftar Paslon"}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Kenali kandidat lebih dulu. Saat bilik suara dibuka, Anda bisa memilih dengan token.
            </p>
          </div>
        </div>

        {!hasCandidates ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Paslon belum dipublikasikan untuk pemilihan ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCardItem
                key={c.id}
                electionName={electionName}
                candidate={c}
                voteEnabled={voteEnabled}
                voteDisabledLabel={voteDisabledLabel}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
