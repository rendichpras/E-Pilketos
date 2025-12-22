"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { VoteStepper } from "@/components/vote/vote-stepper";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";
import { VoteStateCard } from "@/components/vote/vote-state-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

function normalizeToken(raw: string) {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  const formatted = cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned;
  return { cleaned, formatted };
}

export default function VoteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voteState = useMemo(() => {
    const reason = searchParams.get("reason");
    if (!reason) return null;

    if (reason === "invalid_token") {
      return {
        title: "Token tidak valid.",
        description: "Token tidak ditemukan atau formatnya tidak sesuai dengan data panitia.",
        tone: "destructive" as const
      };
    }

    if (reason === "token_used") {
      return {
        title: "Token sudah digunakan.",
        description: "Token hanya berlaku satu kali. Jika Anda belum memilih, segera hubungi panitia.",
        tone: "default" as const
      };
    }

    if (reason === "session_expired") {
      return {
        title: "Sesi token berakhir.",
        description: "Masuk kembali menggunakan token yang sama untuk melanjutkan pemilihan.",
        tone: "default" as const
      };
    }

    if (reason === "token_ambiguous") {
      return {
        title: "Token terdeteksi ganda.",
        description: "Token Anda terkait dengan lebih dari satu pemilihan aktif. Hubungi panitia.",
        tone: "destructive" as const
      };
    }

    if (reason === "election_inactive") {
      return {
        title: "Pemilihan belum tersedia.",
        description: "Status pemilihan belum ACTIVE atau berada di luar jadwal.",
        tone: "default" as const
      };
    }

    return null;
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const { cleaned, formatted } = normalizeToken(token);

    if (!cleaned) {
      setError("Token wajib diisi.");
      return;
    }
    if (cleaned.length !== 8) {
      setError("Token belum lengkap. Format: XXXX-YYYY");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/auth/token-login", { token: formatted });
      router.replace("/vote/surat-suara");
    } catch (err: any) {
      const code = err?.data?.code as string | undefined;
      if (code === "TOKEN_INVALID") {
        router.replace("/vote?reason=invalid_token");
        return;
      }
      if (code === "TOKEN_USED") {
        router.replace("/vote?reason=token_used");
        return;
      }
      if (code === "ELECTION_INACTIVE") {
        router.replace("/vote?reason=election_inactive");
        return;
      }
      if (code === "TOKEN_AMBIGUOUS") {
        router.replace("/vote?reason=token_ambiguous");
        return;
      }
      setError(err?.data?.error ?? "Gagal memverifikasi token.");
    } finally {
      setSubmitting(false);
    }
  }

  if (voteState) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md space-y-5">
            <VoteStepper step={1} />

            <VoteStateCard
              eyebrow="TOKEN"
              title={voteState.title}
              description={voteState.description}
              tone={voteState.tone}
              actions={
                <>
                  <Button
                    className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                    onClick={() => router.replace("/vote")}
                  >
                    Kembali
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                  >
                    <a href="mailto:panitia@sekolah.id">Kontak Panitia</a>
                  </Button>
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-5">
          <VoteStepper step={1} />

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-3 text-center">
              <div className="bg-primary/10 text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-full">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">Masukkan Token</CardTitle>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <VoteReasonAlert />

                <div className="space-y-2">
                  <label
                    htmlFor="token"
                    className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase"
                  >
                    token
                  </label>

                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(normalizeToken(e.target.value).formatted)}
                    placeholder="XXXX-YYYY"
                    maxLength={9}
                    className={cn(
                      "h-11 text-center font-mono text-lg tracking-[0.35em] uppercase",
                      error && "border-destructive focus-visible:ring-destructive/40"
                    )}
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    inputMode="text"
                    autoFocus
                    disabled={submitting}
                  />
                </div>

                {error ? (
                  <Alert variant="destructive" className="text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                  disabled={submitting}
                >
                  {submitting ? "Memverifikasi..." : "Masuk"}
                </Button>

                <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
                  Token hanya dapat digunakan satu kali.
                </p>
              </CardContent>
            </form>
          </Card>

          <div className="pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" />
        </div>
      </div>
    </div>
  );
}
