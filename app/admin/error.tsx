"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bug, LayoutDashboard, LogOut, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="w-full space-y-6">
      <header className="space-y-3">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
          sistem
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <AlertTriangle className="text-destructive h-6 w-6" />
              Terjadi gangguan
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Halaman admin gagal dimuat karena ada error. Coba muat ulang, kembali ke dashboard,
              atau login ulang.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full text-[11px] font-medium">
            Error boundary
          </Badge>
        </div>
      </header>

      <Card className="border-destructive/30 bg-card/95 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bug className="text-muted-foreground h-4 w-4" />
            Ringkasan error
          </CardTitle>
          <CardDescription className="text-xs">
            Detail teknis disembunyikan di produksi; gunakan kode insiden jika tersedia.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive" className="text-xs">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle>Gagal memuat halaman admin</AlertTitle>
              <AlertDescription>
                {error?.message ? error.message : "Terjadi kesalahan tak terduga."}
              </AlertDescription>
            </div>
          </Alert>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                kode insiden
              </div>
              <div className="mt-1 font-mono text-xs">{error.digest ? error.digest : "-"}</div>
            </div>

            <div className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                saran
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Jika berulang, cek log server atau hubungi pengelola sistem.
              </div>
            </div>
          </div>

          {isDev ? (
            <>
              <Separator />
              <Accordion type="single" collapsible>
                <AccordionItem value="detail">
                  <AccordionTrigger className="text-sm">Detail teknis (dev)</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-muted/30 text-muted-foreground border-border/60 max-h-[260px] overflow-auto rounded-xl border p-3 text-[11px] leading-relaxed">
                      {error.stack ? error.stack : "No stack trace"}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.replace("/admin/dashboard")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Ke dashboard
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.replace("/admin/login")}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Login ulang
          </Button>

          <Button type="button" className="w-full sm:w-auto" onClick={() => reset()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Coba lagi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
