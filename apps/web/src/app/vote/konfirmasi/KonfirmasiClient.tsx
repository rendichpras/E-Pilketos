"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PublicCandidatesResponse, CandidatePair, Election } from "@/lib/types";
import { VoteShell } from "@/components/vote/vote-shell";
import { VoteHeader } from "@/components/vote/vote-header";
import { VoteKonfirmasiSkeleton } from "@/components/vote/vote-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Vote as VoteIcon, AlertCircle } from "lucide-react";

type State = {
  loading: boolean;
  error: string | null;
  election: Election | null;
  candidate: CandidatePair | null;
  submitting: boolean;
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

export default function KonfirmasiClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("paslon");

  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    election: null,
    candidate: null,
    submitting: false
  });

  useEffect(() => {
    const reset = () => setState((p) => ({ ...p, submitting: false }));
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
      if (!candidateId) {
        router.replace("/vote/surat-suara?reason=missing_choice");
        return;
      }

      try {
        const data = await apiClient.get<PublicCandidatesResponse>("/voter/candidates");
        if (cancelled) return;

        const found = data.candidates.find((c) => c.id === candidateId);
        if (!found) {
          router.replace("/vote/surat-suara?reason=invalid_choice");
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          election: data.election,
          candidate: found,
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
  }, [candidateId, router]);

  const electionRange = useMemo(() => {
    if (!state.election) return null;
    return formatRange(state.election.startAt, state.election.endAt);
  }, [state.election]);

  async function handleSubmit() {
    if (!state.candidate || state.submitting) return;

    setState((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      await apiClient.post("/voter/vote", { candidatePairId: state.candidate.id });
      router.replace("/vote/sukses");
    } catch (err: any) {
      const msg: string = err?.data?.error ?? "";

      if (err?.status === 401) {
        router.replace("/vote?reason=session_expired");
        return;
      }

      if (err?.status === 400 && msg.toLowerCase().includes("token sudah digunakan")) {
        router.replace("/vote/sukses?reason=token_used");
        return;
      }

      if (err?.status === 400 && msg.toLowerCase().includes("pasangan calon tidak valid")) {
        router.replace("/vote/surat-suara?reason=invalid_choice");
        return;
      }

      setState((prev) => ({
        ...prev,
        submitting: false,
        error: msg || "Gagal menyimpan suara."
      }));
    }
  }

  if (state.loading) return <VoteKonfirmasiSkeleton />;
  if (!state.candidate) return null;

  const anyC = state.candidate as any;
  const photoUrl = anyC.photoUrl ?? anyC.photo_url ?? anyC.photoURL ?? null;

  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        <VoteHeader
          step={3}
          eyebrow="KONFIRMASI"
          title="Konfirmasi pilihan Anda."
          description="Suara tidak dapat diubah setelah dikirim. Pastikan pasangan calon yang Anda pilih sudah benar."
          electionName={state.election?.name ?? null}
          electionRange={electionRange}
        />

        <div className="mx-auto w-full max-w-md space-y-4">
          <Card className="border-border/80 bg-card/95 gap-0 overflow-hidden p-0 py-0 shadow-sm">
            <CardContent className="p-0">
              <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Foto pasangan calon ${anyC.shortName}`}
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

                <div className="absolute top-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-black shadow-sm backdrop-blur">
                  {anyC.number}
                </div>

                <div className="absolute right-3 bottom-3 left-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-white/80 uppercase">
                    pasangan calon
                  </p>
                  <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                    {anyC.shortName}
                  </p>
                </div>
              </div>

              <div className="space-y-4 px-5 pt-4 pb-5">
                <div className="space-y-1 text-center">
                  <p className="text-xl font-semibold">{anyC.shortName}</p>
                  <p className="text-muted-foreground text-sm">
                    Ketua: {anyC.ketuaName} • Wakil: {anyC.wakilName}
                  </p>
                </div>

                {state.error ? (
                  <Alert variant="destructive" className="text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="bg-muted/50 text-muted-foreground space-y-2 rounded-md border px-3 py-2 text-sm">
                  <p>
                    Setelah menekan{" "}
                    <span className="text-foreground font-semibold">Kirim Suara</span>, token Anda
                    akan dinonaktifkan dan suara tidak dapat diubah.
                  </p>
                  <p>Pastikan Anda sudah yakin dengan pilihan sebelum melanjutkan.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground hidden text-sm md:block">
              Pastikan pilihan sudah sesuai sebelum mengirim suara.
            </p>

            <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
              <Button
                type="button"
                variant="outline"
                className="font-mono text-xs tracking-[0.18em] uppercase"
                disabled={state.submitting}
                onClick={() => router.push("/vote/surat-suara")}
              >
                Ganti Pilihan
              </Button>

              <Button
                type="button"
                className="font-mono text-xs tracking-[0.18em] uppercase"
                disabled={state.submitting}
                onClick={handleSubmit}
              >
                {state.submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>Kirim Suara</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </VoteShell>
  );
}
