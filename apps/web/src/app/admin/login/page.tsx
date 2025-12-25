"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { apiClient } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Activity,
  KeyRound,
  Loader2
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.length > 0 && !submitting;
  }, [username, password, submitting]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/admin/auth/login", {
        username,
        password
      });
      router.replace("/admin/dashboard");
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal login. Periksa kembali username dan password.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="border-border/70 bg-card/95 w-full max-w-5xl overflow-hidden rounded-3xl shadow-sm">
          <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="border-border/60 bg-muted/20 hidden flex-col justify-between border-r p-8 md:flex">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full font-mono text-[11px] font-medium tracking-[0.18em] uppercase"
                >
                  panel admin
                </Badge>

                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                    Masuk untuk mengelola pemilihan secara terpusat.
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Kelola pemilihan, kandidat, token, dan hasil dengan UI yang konsisten dan aman.
                  </p>
                </div>

                <Separator className="my-4" />

                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="border-border/60 bg-background/60 flex h-9 w-9 items-center justify-center rounded-2xl border">
                      <ShieldCheck className="text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm leading-none font-semibold">Akses terbatas</p>
                      <p className="text-muted-foreground text-xs">
                        Hanya panitia berwenang yang dapat masuk.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="border-border/60 bg-background/60 flex h-9 w-9 items-center justify-center rounded-2xl border">
                      <Activity className="text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm leading-none font-semibold">Aktivitas terpantau</p>
                      <p className="text-muted-foreground text-xs">
                        Perubahan data admin lebih mudah diaudit.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="border-border/60 bg-background/60 flex h-9 w-9 items-center justify-center rounded-2xl border">
                      <KeyRound className="text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm leading-none font-semibold">Token & hasil</p>
                      <p className="text-muted-foreground text-xs">
                        Generate token dan rekap hasil dari satu panel.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="text-muted-foreground mt-8 space-y-2 text-xs">
                <p className="font-mono tracking-[0.16em] uppercase">catatan keamanan</p>
                <ul className="space-y-1">
                  <li>- Jangan bagikan kredensial admin.</li>
                  <li>- Gunakan perangkat yang aman.</li>
                  <li>- Logout setelah selesai.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src="/logo-osis.png"
                    alt="Logo OSIS"
                    width={32}
                    height={32}
                    className="h-8 w-auto object-contain md:h-9"
                    priority
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm leading-none font-semibold">E-Pilketos Admin</p>
                    <p className="text-muted-foreground text-xs">Login panel panitia</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                  autentikasi
                </p>
                <h2 className="text-xl font-semibold tracking-tight">Masuk</h2>
                <p className="text-muted-foreground text-sm">
                  Masukkan username dan password untuk mengakses panel admin.
                </p>
              </div>

              <Separator className="my-5" />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="misal: admin"
                    disabled={submitting}
                    autoFocus
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={submitting}
                      className="h-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-8 w-8"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={submitting}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <AlertTitle>Gagal masuk</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="h-10 w-full font-mono text-xs tracking-[0.18em] uppercase"
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Masuk ke Panel Admin
                    </>
                  )}
                </Button>

                <p className="text-muted-foreground text-center text-[11px]">
                  Pastikan Anda menggunakan perangkat yang aman saat mengakses panel admin.
                </p>
              </form>

              <div className="border-border/60 bg-muted/20 mt-6 rounded-2xl border p-4 md:hidden">
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                  catatan keamanan
                </p>
                <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                  <li>- Jangan bagikan kredensial admin.</li>
                  <li>- Gunakan perangkat yang aman.</li>
                  <li>- Logout setelah selesai.</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
