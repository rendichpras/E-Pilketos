"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { VoteStepper } from "@/components/vote/vote-stepper";
import { VoteReasonAlert } from "@/components/vote/vote-reason-alert";
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

  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err?.data?.error ?? "Gagal memverifikasi token.");
    } finally {
      setSubmitting(false);
    }
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
