"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PublicCandidatesResponse, CandidatePair, Election } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { VoteStepIndicator } from "@/components/vote-step-indicator";

type State = {
  loading: boolean;
  error: string | null;
  election: Election | null;
  candidates: CandidatePair[];
  selectedId: string | null;
};

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
    let cancelled = false;

    async function load() {
      try {
        const data = await apiClient.get<PublicCandidatesResponse>("/voter/candidates");
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            election: data.election,
            candidates: data.candidates
          }));
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 401) {
          router.replace("/vote");
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

  if (state.loading) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <div className="container mx-auto max-w-md px-4">
          <Card className="border-destructive/40 bg-card/95 w-full">
            <CardContent className="space-y-4 py-6 text-center">
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-[11px] tracking-[0.16em] uppercase"
                onClick={() => router.replace("/vote")}
              >
                Kembali ke Halaman Token
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedCandidate = state.candidates.find((c) => c.id === state.selectedId);

  function handleNext() {
    if (!state.selectedId || submitting) return;
    setSubmitting(true);
    router.push(`/vote/konfirmasi?paslon=${state.selectedId}`);
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="space-y-5">
          <VoteStepIndicator step={2} />

          <section className="space-y-3">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
              surat suara digital
            </p>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
                Pilih pasangan calon yang akan Anda dukung.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                Klik pada kartu pasangan calon untuk memilih. Anda hanya dapat mengirim satu suara
                dan pilihan tidak dapat diubah setelah dikonfirmasi.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6">
          {state.candidates.length === 0 ? (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                Belum ada pasangan calon yang tersedia untuk dipilih.
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                {state.candidates.map((c) => {
                  const isSelected = state.selectedId === c.id;

                  return (
                    <Card
                      key={c.id}
                      onClick={() =>
                        !submitting &&
                        setState((prev) => ({
                          ...prev,
                          selectedId: isSelected ? null : c.id
                        }))
                      }
                      className={cn(
                        "border-border/80 bg-card/95 hover:border-primary/60 hover:bg-primary/5 relative flex cursor-pointer flex-col transition-all",
                        isSelected &&
                          "border-primary ring-primary/40 ring-offset-background ring-2 ring-offset-2"
                      )}
                    >
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-tr-xl rounded-bl-xl px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase">
                          terpilih
                        </div>
                      )}

                      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold transition-colors md:h-12 md:w-12",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {c.number}
                        </div>
                        <div className="space-y-1">
                          <CardDescription className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                            pasangan calon
                          </CardDescription>
                          <CardTitle className="text-base md:text-lg">{c.shortName}</CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pb-4">
                        <div className="grid gap-3 text-sm md:grid-cols-2">
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                              ketua
                            </span>
                            <p className="leading-tight font-semibold">{c.ketuaName}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                              wakil
                            </span>
                            <p className="leading-tight font-semibold">{c.wakilName}</p>
                          </div>
                        </div>

                        {c.vision && (
                          <p className="text-muted-foreground line-clamp-2 text-[11px] italic">
                            “{c.vision}”
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="text-muted-foreground flex flex-col items-stretch gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between">
                <p className="max-w-xl">
                  Pastikan pilihan sudah sesuai sebelum melanjutkan ke tahap konfirmasi.
                </p>
                <Button
                  size="lg"
                  className="w-full font-mono text-xs tracking-[0.18em] uppercase md:w-auto"
                  disabled={!state.selectedId || submitting}
                  onClick={handleNext}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengarahkan...
                    </>
                  ) : (
                    "Lanjut ke Konfirmasi"
                  )}
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
