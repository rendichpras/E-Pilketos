"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { voterApi } from "@/lib/api/voter";
import { ERROR_CODES } from "@/lib/types";
import type { CandidatePair, Election } from "@/lib/types";

import { VoteShell } from "@/components/vote/vote-shell";
import { ElectionInfo } from "@/components/vote/election-info";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

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

function CandidateDetailDrawer({
  electionName,
  candidate,
  disabled
}: {
  electionName: string | null;
  candidate: CandidatePair;
  disabled: boolean;
}) {
  const title = candidate.shortName ?? `Paslon ${candidate.number}`;
  const photoUrl = candidate.photoUrl ?? null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full sm:w-auto">
          Lihat Detail
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[92vh] p-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base md:text-lg">
              Paslon {candidate.number} — {title}
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              {electionName ?? "Detail pasangan calon"}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <AspectRatio ratio={3 / 4} className="bg-muted/40 overflow-hidden rounded-lg border">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={`Foto ${title}`}
                    fill
                    className="object-cover object-top"
                    unoptimized
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

  const [confirmOpen, setConfirmOpen] = useState(false);

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
        const data = await voterApi.getCandidates();
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
      } catch (err: unknown) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 401) {
          router.replace("/vote?reason=session_expired");
          return;
        }

        const message =
          err instanceof ApiError ? err.message || "Gagal memuat data." : "Gagal memuat data.";

        setState((prev) => ({
          ...prev,
          loading: false,
          error: message
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

  async function submitVote() {
    if (!state.candidate || state.submitting) return;

    setState((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      await voterApi.vote(state.candidate.id);
      router.replace("/vote/sukses");
    } catch (err: unknown) {
      const isApiError = err instanceof ApiError;
      const msg: string = isApiError ? err.message : "";
      const code = isApiError ? err.code : undefined;
      const status = isApiError ? err.status : 0;

      if (status === 401) {
        router.replace("/vote?reason=session_expired");
        return;
      }

      if (code === ERROR_CODES.TOKEN_USED) {
        router.replace("/vote/sukses?reason=token_used");
        return;
      }

      if (code === ERROR_CODES.CANDIDATE_INVALID) {
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

  if (state.loading) {
    return (
      <VoteShell>
        <div className="text-muted-foreground text-sm">Memuat konfirmasi...</div>
      </VoteShell>
    );
  }

  if (!state.candidate) {
    if (!state.error) return null;

    return (
      <VoteShell className="flex items-center">
        <div className="mx-auto w-full max-w-md">
          <Card className="border-destructive/40 bg-card/95 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Tidak bisa memuat konfirmasi</CardTitle>
              <CardDescription className="text-sm">
                Pastikan koneksi internet stabil, lalu coba lagi.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <Alert variant="destructive" className="text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="bg-muted/10 flex flex-col gap-2 border-t">
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                Coba Lagi
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.replace("/vote/surat-suara")}
              >
                Kembali ke Surat Suara
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.replace("/vote")}>
                Kembali ke Halaman Token
              </Button>
            </CardFooter>
          </Card>
        </div>
      </VoteShell>
    );
  }

  const candidate = state.candidate;
  const title = candidate.shortName ?? `Paslon ${candidate.number}`;
  const photoUrl = candidate.photoUrl ?? null;

  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        <section className="space-y-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
              Konfirmasi pilihan Anda.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
              Suara tidak dapat diubah setelah dikirim. Pastikan pasangan calon yang Anda pilih
              sudah benar.
            </p>
            <ElectionInfo name={state.election?.name ?? null} range={electionRange} />
          </div>
        </section>

        <VoteReasonAlert />

        <Card className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate text-xl leading-tight">{title}</CardTitle>
                <CardDescription className="text-sm">
                  Ketua:{" "}
                  <span className="text-foreground font-semibold">{candidate.ketuaName}</span>{" "}
                  <span className="text-muted-foreground">({candidate.ketuaClass})</span>
                  {" - "}
                  Wakil:{" "}
                  <span className="text-foreground font-semibold">{candidate.wakilName}</span>{" "}
                  <span className="text-muted-foreground">({candidate.wakilClass})</span>
                </CardDescription>
              </div>

              <Badge variant="outline" className="shrink-0">
                #{candidate.number}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-[320px_1fr] md:items-start">
            <AspectRatio
              ratio={3 / 4}
              className="bg-muted/40 overflow-hidden rounded-xl border shadow-sm"
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`Foto ${title}`}
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                  Foto belum tersedia
                </div>
              )}
            </AspectRatio>

            <div className="space-y-4">
              <div className="bg-muted/10 rounded-xl border p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div className="space-y-1">
                    <p className="text-foreground text-sm">
                      Setelah menekan <span className="font-semibold">Kirim Suara</span>, token Anda
                      akan dinonaktifkan dan suara tidak dapat diubah.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Jika sudah yakin, lanjutkan pengiriman.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-background/60 rounded-xl border p-4">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                    Ketua
                  </p>
                  <p className="mt-1 leading-tight font-semibold">{candidate.ketuaName}</p>
                  <p className="text-muted-foreground text-sm">{candidate.ketuaClass}</p>
                </div>

                <div className="bg-background/60 rounded-xl border p-4">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                    Wakil
                  </p>
                  <p className="mt-1 leading-tight font-semibold">{candidate.wakilName}</p>
                  <p className="text-muted-foreground text-sm">{candidate.wakilClass}</p>
                </div>
              </div>

              {state.error ? (
                <Alert variant="destructive" className="text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              disabled={state.submitting}
              onClick={() => router.push("/vote/surat-suara")}
              className="w-full sm:w-auto"
            >
              Ganti Pilihan
            </Button>

            <div className="w-full sm:w-auto">
              <CandidateDetailDrawer
                electionName={state.election?.name ?? null}
                candidate={state.candidate}
                disabled={state.submitting}
              />
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                dipilih
              </p>
              <p className="truncate text-sm font-semibold">
                {candidate.number} - {title}
              </p>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  className="shrink-0 font-mono text-xs tracking-[0.18em] uppercase"
                  size="lg"
                  disabled={state.submitting}
                >
                  {state.submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Suara"
                  )}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Yakin kirim suara?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Setelah dikirim, suara tidak dapat diubah dan token Anda akan dinonaktifkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={state.submitting}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={state.submitting}
                    onClick={() => {
                      setConfirmOpen(false);
                      submitVote();
                    }}
                  >
                    Kirim Sekarang
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </VoteShell>
  );
}
