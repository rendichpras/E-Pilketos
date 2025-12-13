"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PublicCandidatesResponse, CandidatePair, Election } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { VoteStepIndicator } from "@/components/vote-step-indicator";
import { Loader2, Vote } from "lucide-react";

type State = {
  loading: boolean;
  error: string | null;
  election: Election | null;
  candidate: CandidatePair | null;
  submitting: boolean;
};

export default function VoteKonfirmasiPage() {
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
    let cancelled = false;

    async function load() {
      if (!candidateId) {
        router.replace("/vote/surat-suara");
        return;
      }

      try {
        const data = await apiClient.get<PublicCandidatesResponse>("/voter/candidates");

        if (cancelled) return;

        const found = data.candidates.find((c) => c.id === candidateId);
        if (!found) {
          router.replace("/vote/surat-suara");
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          election: data.election,
          candidate: found
        }));
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
  }, [candidateId, router]);

  async function handleSubmit() {
    if (!state.candidate) return;
    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      await apiClient.post("/voter/vote", {
        candidatePairId: state.candidate.id
      });
      router.replace("/vote/sukses");
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: err?.data?.error ?? "Gagal menyimpan suara."
      }));
    }
  }

  if (state.loading) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state.error && !state.candidate) {
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

  if (!state.candidate) {
    return null;
  }

  const { candidate } = state;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-6 py-10 md:py-16">
          <section className="space-y-3">
            <VoteStepIndicator step={3} />

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
                Konfirmasi pilihan Anda.
              </h1>
              <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                Suara tidak dapat diubah setelah dikirim. Pastikan pasangan calon yang Anda pilih
                sudah benar.
              </p>
            </div>
          </section>

          <Card className="border-border/80 bg-card/95 mx-auto mt-2 w-full max-w-md shadow-sm">
            <CardHeader className="space-y-4 text-center">
              <div className="bg-primary text-primary-foreground mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold">
                {candidate.number}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">{candidate.shortName}</CardTitle>
                <CardDescription className="text-sm">
                  Ketua: {candidate.ketuaName} • Wakil: {candidate.wakilName}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {state.error && (
                <Alert variant="destructive" className="text-xs">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-muted text-muted-foreground space-y-2 rounded-md px-3 py-2 text-sm">
                <p>
                  Setelah menekan <span className="text-foreground font-semibold">Kirim Suara</span>
                  , token Anda akan dinonaktifkan dan suara tidak dapat diubah.
                </p>
                <p>Pastikan Anda sudah yakin dengan pilihan sebelum melanjutkan.</p>
              </div>
            </CardContent>

            <CardFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                disabled={state.submitting}
                onClick={() => router.push("/vote/surat-suara")}
              >
                Kembali ganti pilihan
              </Button>

              <Button
                type="button"
                className="w-full sm:flex-1"
                disabled={state.submitting}
                onClick={handleSubmit}
              >
                {state.submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Vote className="mr-2 h-4 w-4" />
                    Kirim Suara
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
