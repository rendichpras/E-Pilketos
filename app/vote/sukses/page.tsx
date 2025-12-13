import Link from "next/link";
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
import { CheckCircle2 } from "lucide-react";

export default function VoteSuccessPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12 md:px-6">
        <Card className="border-border/80 bg-card/95 w-full max-w-md text-center shadow-sm">
          <CardHeader className="space-y-4">
            <Badge
              variant="outline"
              className="mx-auto font-mono text-[11px] tracking-[0.18em] uppercase"
            >
              pemungutan suara selesai
            </Badge>
            <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">Suara Anda sudah tercatat.</CardTitle>
              <CardDescription className="text-sm">
                Terima kasih atas partisipasi Anda dalam pemilihan ketua OSIS. Seluruh langkah
                pemungutan suara telah selesai.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Token yang Anda gunakan telah dinonaktifkan secara otomatis untuk menjaga integritas
              pemilihan. Anda tidak dapat masuk kembali ke bilik suara menggunakan token yang sama.
            </p>

            <div className="bg-muted/40 space-y-2 rounded-md border p-3 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono tracking-[0.18em] uppercase">
                  status suara
                </span>
                <Badge className="px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] uppercase">
                  tercatat
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Jika panitia mengizinkan, Anda dapat memantau hasil rekap di halaman hasil
                penghitungan.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full font-mono text-[11px] tracking-[0.16em] uppercase"
            >
              <Link href="/results">Lihat Hasil</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
