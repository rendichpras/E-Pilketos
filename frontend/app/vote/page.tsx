"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Lock, AlertCircle } from "lucide-react";
import { VoteStepIndicator } from "@/components/vote-step-indicator";

export default function VoteTokenPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleaned = token.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!cleaned) {
      setError("Token wajib diisi.");
      return;
    }

    const formatted = cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned;

    setSubmitting(true);
    try {
      await apiClient.post("/auth/token-login", { token: formatted });
      router.replace("/vote/surat-suara");
    } catch (err: any) {
      setError(err?.data?.error ?? "Token tidak valid atau sesi berakhir.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-6 py-10 md:py-16">
          <VoteStepIndicator step={1} />

          <section className="space-y-3">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
              bilik suara
            </p>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
                Masuk ke bilik suara dengan token unik Anda.
              </h1>
              <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                Masukkan kode token yang diterima dari panitia untuk memulai proses pemungutan
                suara.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            <Card className="border-border/80 bg-card/95 mx-auto w-full max-w-md shadow-sm">
              <CardHeader className="space-y-3 text-center">
                <div className="bg-primary/10 text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-full">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">Masukkan Token Pemilih</CardTitle>
                  <CardDescription className="text-sm">
                    Token terdiri dari kombinasi huruf dan angka, contoh:
                    <span className="font-mono"> 9UPE-4LBR</span>.
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cleaned = raw
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, 8);
                      const formatted =
                        cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned;
                      setToken(formatted);
                    }}
                    placeholder="XXXX-YYYY"
                    maxLength={9}
                    className="h-11 text-center font-mono text-lg tracking-[0.35em] uppercase"
                    autoComplete="off"
                    autoFocus
                    disabled={submitting}
                  />

                  {error && (
                    <Alert variant="destructive" className="text-xs">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                    disabled={submitting}
                  >
                    {submitting ? "Memverifikasi..." : "Masuk ke Bilik Suara"}
                  </Button>
                  <p className="text-muted-foreground text-center text-[11px]">
                    Token bersifat rahasia dan hanya dapat digunakan satu kali. Jika token tidak
                    dapat digunakan, segera hubungi panitia.
                  </p>
                </CardFooter>
              </form>
            </Card>

            <div className="text-muted-foreground space-y-1 text-xs">
              <p className="font-mono tracking-[0.18em]">Panduan singkat</p>
              <ul className="space-y-0.5">
                <li>• Pastikan token sesuai dengan yang tercetak di kartu.</li>
                <li>• Jangan membagikan token kepada siapa pun.</li>
                <li>• Setelah digunakan, token otomatis dinonaktifkan oleh sistem.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
