"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const digestLabel = error.digest ?? "Tidak tersedia";
  const timeLabel = new Date().toLocaleString("id-ID");

  return (
    <html lang="id">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center px-4">
          <Card className="border-destructive/30 bg-card/95 w-full max-w-xl shadow-lg">
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <div className="bg-destructive/10 text-destructive flex h-14 w-14 items-center justify-center rounded-full">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Terjadi Kesalahan Sistem
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Aplikasi mengalami masalah tak terduga. Coba muat ulang halaman atau kembali ke
                  beranda.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="text-muted-foreground space-y-3 text-xs">
              <div className="border-destructive/30 bg-destructive/5 flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-mono tracking-[0.16em] uppercase">kode error</span>
                <span className="font-mono text-[0.7rem]">{digestLabel}</span>
              </div>
              <div className="border-border/70 bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-mono tracking-[0.16em] uppercase">waktu kejadian</span>
                <span className="font-mono text-[0.7rem]">{timeLabel}</span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => reset()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Muat Ulang
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
              </div>

              <p className="text-muted-foreground text-center text-[10px] sm:text-right">
                Jika masalah berulang, laporkan ke panitia atau administrator sistem.
              </p>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
