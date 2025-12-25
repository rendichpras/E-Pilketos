"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api-client";

import { VoteShell } from "@/components/vote/vote-shell";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

type TokenLoginResponse = {
  electionId: string;
  electionSlug: string;
  electionName: string;
};

function formatToken(raw: string) {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

function isTokenComplete(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").length === 8;
}

export default function VoteClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(() => isTokenComplete(token), [token]);

  useEffect(() => {
    setError(null);
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post<TokenLoginResponse>("/auth/token-login", { token });
      router.replace("/vote/surat-suara");
    } catch (err: any) {
      const msg: string = err?.data?.error ?? "";
      const code: string | undefined = err?.data?.code;

      if (err?.status === 401 || code === "TOKEN_INVALID") {
        router.replace("/vote?reason=invalid_token");
        setSubmitting(false);
        return;
      }

      if (err?.status === 409 && code === "TOKEN_USED") {
        router.replace("/vote?reason=token_used");
        setSubmitting(false);
        return;
      }

      if (err?.status === 400 && code === "ELECTION_INACTIVE") {
        router.replace("/vote?reason=election_inactive");
        setSubmitting(false);
        return;
      }

      if (err?.status === 409 && code === "TOKEN_AMBIGUOUS") {
        router.replace("/vote?reason=token_ambiguous");
        setSubmitting(false);
        return;
      }

      setError(msg || "Gagal memverifikasi token.");
      setSubmitting(false);
    }
  }

  return (
    <VoteShell className="flex items-center">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Masukkan token.</h1>
            <p className="text-muted-foreground text-sm">
              Token unik dari panitia. Satu token hanya bisa dipakai sekali.
            </p>
          </div>

          <VoteReasonAlert />

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <form onSubmit={onSubmit}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Verifikasi token</CardTitle>
                    <CardDescription className="text-sm">
                      Masukkan 8 karakter (huruf/angka). Tanda hubung akan terisi otomatis.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="mb-6 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Input
                    id="token"
                    name="token"
                    value={token}
                    onChange={(e) => setToken(formatToken(e.target.value))}
                    placeholder="XXXX-YYYY"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="one-time-code"
                    inputMode="text"
                    className="font-mono tracking-[0.18em]"
                  />
                </div>

                {error ? (
                  <Alert variant="destructive" className="text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>

              <CardFooter className="bg-muted/10 flex flex-col gap-3 border-t">
                <Button type="submit" size="lg" className="w-full" disabled={!ready || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>

                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline" className="w-full" disabled={submitting}>
                    <Link href="/">Kembali</Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full" disabled={submitting}>
                    <Link href="/#kandidat">Lihat Kandidat</Link>
                  </Button>
                </div>

                <p className="text-muted-foreground text-xs">
                  Jika token Anda bermasalah, hubungi panitia untuk verifikasi.
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </VoteShell>
  );
}
