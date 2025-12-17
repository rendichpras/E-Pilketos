"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PublicCandidatesResponse, CandidatePair, Election } from "@/lib/types";
import { saveVoteSelection } from "@/lib/vote-selection";
import { VoteShell } from "@/components/vote/vote-shell";
import { VoteHeader } from "@/components/vote/vote-header";
import { VoteSuratSuaraSkeleton } from "@/components/vote/vote-skeletons";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/cn";

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
    year: "numeric"
  });
  const timeFmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${dateFmt.format(start)} • ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  return `${dateFmt.format(start)} ${timeFmt.format(start)} — ${dateFmt.format(end)} ${timeFmt.format(
    end
  )}`;
}

export default function VoteSuratSuaraPage() {
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

  if (state.loading) return <VoteSuratSuaraSkeleton />;

  if (state.error) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <div className="container mx-auto max-w-md px-4">
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
      </div>
    );
  }

  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
        <VoteHeader
          step={2}
          eyebrow="SURAT SUARA DIGITAL"
          title="Pilih pasangan calon yang akan Anda dukung."
          description="Klik/tap untuk memilih. Suara tidak dapat diubah setelah dikonfirmasi."
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
          <section className="space-y-6">
            <div
              className="grid gap-5 md:grid-cols-2"
              role="radiogroup"
              aria-label="Pilih pasangan calon"
            >
              {state.candidates.map((c) => {
                const isSelected = state.selectedId === c.id;
                const anyC = c as any;
                const photoUrl = anyC.photoUrl ?? anyC.photo_url ?? anyC.photoURL ?? null;

                return (
                  <Card
                    key={c.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => !submitting && setState((p) => ({ ...p, selectedId: c.id }))}
                    onKeyDown={(e) => {
                      if (submitting) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setState((p) => ({ ...p, selectedId: c.id }));
                      }
                    }}
                    className={cn(
                      "bg-card text-card-foreground cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all",
                      "gap-0 p-0 py-0",
                      "hover:border-primary/60",
                      isSelected &&
                        "border-primary ring-primary/30 ring-offset-background ring-2 ring-offset-2",
                      submitting && "pointer-events-none opacity-90"
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={`Foto pasangan calon ${c.shortName}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                            <span className="font-mono text-[11px] tracking-[0.18em] uppercase">
                              tanpa foto
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

                        <div
                          className={cn(
                            "absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold shadow-sm backdrop-blur",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-white/90 text-black"
                          )}
                        >
                          {c.number}
                        </div>

                        <div className="absolute top-3 right-3">
                          <div
                            className={cn(
                              "h-9 w-9 items-center justify-center rounded-full shadow-sm",
                              isSelected ? "bg-primary text-primary-foreground flex" : "hidden"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="absolute right-3 bottom-3 left-3">
                          <p className="font-mono text-[10px] tracking-[0.18em] text-white/80 uppercase">
                            pasangan calon
                          </p>
                          <p className="mt-1 line-clamp-2 text-base font-semibold text-white md:text-lg">
                            {c.shortName}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pt-4 pb-5">
                        <div className="grid gap-3 text-sm md:grid-cols-2">
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                              ketua
                            </span>
                            <p className="leading-tight font-semibold">
                              {c.ketuaName}
                              {c.ketuaClass ? (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  ({c.ketuaClass})
                                </span>
                              ) : null}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                              wakil
                            </span>
                            <p className="leading-tight font-semibold">
                              {c.wakilName}
                              {c.wakilClass ? (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  ({c.wakilClass})
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>

                        {c.vision ? (
                          <p className="text-muted-foreground mt-4 line-clamp-2 text-[11px] italic">
                            “{c.vision}”
                          </p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground hidden text-sm md:block">
              Pastikan pilihan sudah sesuai sebelum melanjutkan ke tahap konfirmasi.
            </p>

            <div className="min-w-0 md:hidden">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                pilihan
              </p>
              <p className="truncate text-sm font-semibold">
                {selectedCandidate
                  ? `${selectedCandidate.number} • ${selectedCandidate.shortName}`
                  : "Belum memilih"}
              </p>
            </div>

            <Button
              size="lg"
              className="shrink-0 font-mono text-xs tracking-[0.18em] uppercase"
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
