"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { VoteShell } from "@/components/vote/vote-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { CheckCircle2, Lock, AlertTriangle, Timer } from "lucide-react";

type Copy = {
  tone: "success" | "warning" | "info";
  title: string;
  desc: string;
  primaryCta: { label: string; href: string };
};

export default function SuksesClient() {
  const sp = useSearchParams();

  const copy = useMemo<Copy>(() => {
    const reason = sp.get("reason");

    if (reason === "token_used") {
      return {
        tone: "warning",
        title: "Token sudah digunakan.",
        desc: "Jika Anda sudah memilih sebelumnya, suara Anda sudah tercatat. Jika belum memilih, hubungi panitia untuk verifikasi.",
        primaryCta: { label: "Kembali ke Beranda", href: "/" }
      };
    }

    if (reason === "session_expired") {
      return {
        tone: "info",
        title: "Sesi Anda berakhir.",
        desc: "Silakan masukkan token kembali untuk melanjutkan proses pemilihan.",
        primaryCta: { label: "Masukkan Token", href: "/vote" }
      };
    }

    return {
      tone: "success",
      title: "Suara Anda sudah tercatat.",
      desc: "Terima kasih. Token yang Anda gunakan telah dinonaktifkan otomatis untuk menjaga integritas pemilihan.",
      primaryCta: { label: "Kembali ke Beranda", href: "/" }
    };
  }, [sp]);

  const Icon =
    copy.tone === "success" ? CheckCircle2 : copy.tone === "warning" ? AlertTriangle : Timer;

  return (
    <VoteShell className="flex items-center">
      <div className="mx-auto w-full max-w-md">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
                <Icon className="h-7 w-7" />
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">{copy.title}</CardTitle>
              <CardDescription className="text-sm">{copy.desc}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="bg-muted/10 rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">
                Hasil belum dibuka oleh panitia. Silakan cek kembali nanti.
              </p>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 flex flex-col gap-2 border-t">
            <Button
              asChild
              size="lg"
              className="w-full"
            >
              <Link href={copy.primaryCta.href}>{copy.primaryCta.label}</Link>
            </Button>

            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Hasil Belum Dipublikasikan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </VoteShell>
  );
}
