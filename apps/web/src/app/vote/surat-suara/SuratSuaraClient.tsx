"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { CandidatePair, Election, PublicCandidatesResponse } from "@/lib/types";
import { saveVoteSelection } from "@/lib/vote-selection";

import { ElectionInfo } from "@/components/vote/election-info";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";
import { VoteShell } from "@/components/vote/vote-shell";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Check, Loader2, ShieldCheck } from "lucide-react";

type State = {
  loading: boolean;
  error: string | null;
  election: Election | null;
  candidates: CandidatePair[];
  selectedId: string | null;
};

function formatRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return null;

  const start = new Date(startIso);
  const end = new Date(endIso);

  const dateFmt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });

  const timeFmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${dateFmt.format(start)} - ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  return `${dateFmt.format(start)} ${timeFmt.format(start)} — ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

function PageHeader({
  title,
  description,
  electionName,
  electionRange
}: {
  title: string;
  description?: string;
  electionName?: string | null;
  electionRange?: string | null;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">{description}</p>
        ) : null}
        <ElectionInfo name={electionName ?? null} range={electionRange ?? null} />
      </div>
    </section>
  );
}

function CandidateDetailDrawer({
  electionName,
  candidate,
  selected,
  disabled,
  onSelect
}: {
  electionName: string | null;
  candidate: CandidatePair;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm" variant="secondary" className="min-w-[76px]" disabled={disabled}>
          Detail
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[92vh] p-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base md:text-lg">
              Paslon {candidate.number} — {candidate.shortName}
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              {electionName ?? "Detail pasangan calon"}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <AspectRatio ratio={3 / 4} className="bg-muted/40 overflow-hidden rounded-lg border">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={`Foto ${candidate.shortName}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    Foto belum tersedia
                  </div>
                )}
              </AspectRatio>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[11px]">
                      Ketua
                    </Badge>
                    <div className="leading-tight font-semibold">{candidate.ketuaName}</div>
                    <div className="text-muted-foreground text-xs">{candidate.ketuaClass}</div>
                  </div>

                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[11px]">
                      Wakil
                    </Badge>
                    <div className="leading-tight font-semibold">{candidate.wakilName}</div>
                    <div className="text-muted-foreground text-xs">{candidate.wakilClass}</div>
                  </div>
                </div>

                <Separator />

                <Tabs defaultValue="visi" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="visi">Visi</TabsTrigger>
                    <TabsTrigger value="misi">Misi</TabsTrigger>
                    <TabsTrigger value="program">Program</TabsTrigger>
                  </TabsList>

                  <TabsContent value="visi" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.vision?.trim() ? candidate.vision : "Belum ada data visi."}
                    </p>
                  </TabsContent>

                  <TabsContent value="misi" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.mission?.trim() ? candidate.mission : "Belum ada data misi."}
                    </p>
                  </TabsContent>

                  <TabsContent value="program" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.programs?.trim() ? candidate.programs : "Belum ada data program."}
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <DrawerFooter className="bg-muted/20 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-2">
            <DrawerClose asChild>
              <Button
                className="w-full sm:w-auto"
                disabled={disabled || selected}
                onClick={onSelect}
              >
                {selected ? "Terpilih" : "Pilih Paslon Ini"}
              </Button>
            </DrawerClose>

            <DrawerClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Tutup
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CandidateCard({
  electionName,
  candidate,
  selected,
  disabled,
  onSelect
}: {
  electionName: string | null;
  candidate: CandidatePair;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex h-full cursor-pointer flex-col overflow-hidden transition-all",
        "hover:border-primary/60",
        selected && "border-primary ring-primary/30 ring-offset-background ring-2 ring-offset-2",
        disabled && "pointer-events-none opacity-90"
      )}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={3 / 4} className="bg-muted/40">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={`Foto ${candidate.shortName}`}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
              Foto belum tersedia
            </div>
          )}
        </AspectRatio>
      </CardContent>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg leading-tight">{candidate.shortName}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              <span className="text-foreground font-semibold">{candidate.ketuaName}</span>{" "}
              <span className="text-muted-foreground">({candidate.ketuaClass})</span>
              {" · "}
              <span className="text-foreground font-semibold">{candidate.wakilName}</span>{" "}
              <span className="text-muted-foreground">({candidate.wakilClass})</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0 text-[11px]">
              #{candidate.number}
            </Badge>
            {selected ? (
              <span className="bg-primary text-primary-foreground inline-flex h-9 w-9 items-center justify-center rounded-full">
                <Check className="h-4 w-4" />
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="text-muted-foreground min-h-[40px] text-sm">
          {candidate.vision?.trim()
            ? `“${candidate.vision}”`
            : "Buka detail untuk melihat visi, misi, dan program."}
        </p>
      </CardContent>

      <CardFooter className="mt-auto w-full justify-end gap-2 border-t">
        <CandidateDetailDrawer
          electionName={electionName}
          candidate={candidate}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
        />

        <Button
          size="sm"
          className="min-w-[64px]"
          variant={selected ? "secondary" : "default"}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? "Terpilih" : "Pilih"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VoteSuratSuaraClient() {
  const router = useRouter();

  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    election: null,
    candidates: [],
    selectedId: null
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const reset = () => setSubmitting(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") reset();
    };

    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiClient.get<PublicCandidatesResponse>("/voter/candidates");
        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          election: data.election,
          candidates: data.candidates,
          error: null
        }));
      } catch (err: any) {
        if (cancelled) return;

        if (err?.status === 401) {
          router.replace("/vote?reason=session_expired");
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.data?.error ?? "Gagal memuat data."
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const electionRange = useMemo(() => {
    if (!state.election) return null;
    return formatRange(state.election.startAt, state.election.endAt);
  }, [state.election]);

  const selectedCandidate = useMemo(
    () => state.candidates.find((c) => c.id === state.selectedId) ?? null,
    [state.candidates, state.selectedId]
  );

  function handleNext() {
    if (!selectedCandidate || submitting) return;

    setSubmitting(true);
    saveVoteSelection({ election: state.election, candidate: selectedCandidate });
    router.push(`/vote/konfirmasi?paslon=${selectedCandidate.id}`);
  }

  if (state.loading) {
    return (
      <VoteShell>
        <div className="text-muted-foreground text-sm">Memuat data surat suara...</div>
      </VoteShell>
    );
  }

  if (state.error) {
    return (
      <VoteShell className="flex items-center">
        <div className="mx-auto w-full max-w-md">
          <Card className="border-destructive/40 bg-card/95 w-full">
            <CardContent className="space-y-4 py-6 text-center">
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-[11px] tracking-[0.16em] uppercase"
                  onClick={() => window.location.reload()}
                >
                  Coba Lagi
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="font-mono text-[11px] tracking-[0.16em] uppercase"
                  onClick={() => router.replace("/vote")}
                >
                  Kembali ke Halaman Token
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </VoteShell>
    );
  }

  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
        <PageHeader
          title="Pilih pasangan calon yang akan Anda dukung."
          description="Pilih salah satu. Suara tidak dapat diubah setelah dikonfirmasi."
          electionName={state.election?.name ?? null}
          electionRange={electionRange}
        />

        <VoteReasonAlert />

        {state.candidates.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Belum ada pasangan calon yang tersedia untuk dipilih.
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <div className="text-muted-foreground rounded-lg border p-3 text-xs">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <p className="leading-relaxed">
                  Buka detail untuk melihat visi, misi, dan program. Setelah yakin, lanjut ke
                  konfirmasi.
                </p>
              </div>
            </div>

            <div className="grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2">
              {state.candidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  electionName={state.election?.name ?? null}
                  candidate={c}
                  selected={state.selectedId === c.id}
                  disabled={submitting}
                  onSelect={() => setState((p) => ({ ...p, selectedId: c.id }))}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                pilihan
              </p>
              <p className="truncate text-sm font-semibold">
                {selectedCandidate
                  ? `${selectedCandidate.number} - ${selectedCandidate.shortName}`
                  : "Belum memilih"}
              </p>
            </div>

            <Button
              size="lg"
              className="shrink-0"
              disabled={!state.selectedId || submitting}
              onClick={handleNext}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengarahkan...
                </>
              ) : (
                "Lanjut"
              )}
            </Button>
          </div>
        </div>
      </div>
    </VoteShell>
  );
}
