import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileQuestion, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center">
        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="space-y-5">
              <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                kode 404
              </p>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Halaman tidak ditemukan.
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  URL yang Anda akses tidak tersedia atau sudah dipindahkan. Periksa kembali alamat
                  yang dimasukkan, atau gunakan pintasan di bawah untuk melanjutkan.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm" className="font-mono text-xs tracking-[0.16em] uppercase">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs tracking-[0.16em] uppercase"
                >
                  <Link href="/vote">Mulai Memilih</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs tracking-[0.16em] uppercase"
                >
                  <Link href="/candidates">Lihat Kandidat</Link>
                </Button>
              </div>

              <div className="text-muted-foreground mt-2 text-xs">
                <p>
                  Jika masalah berlanjut atau Anda yakin ini seharusnya halaman yang valid, hubungi
                  panitia atau administrator sistem.
                </p>
              </div>
            </section>

            <section>
              <Card className="border-border/80 bg-card/95 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
                    <FileQuestion className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Butuh arah?</CardTitle>
                    <CardDescription className="text-xs">
                      Beberapa pintasan cepat untuk kembali ke alur utama pemilihan.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase">
                      <Compass className="h-3.5 w-3.5" />
                      <span>pintasan cepat</span>
                    </div>
                    <Separator />
                  </div>

                  <div className="space-y-2 text-xs">
                    <Link
                      href="/vote"
                      className="border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 transition-colors"
                    >
                      <span>Masuk ke bilik suara</span>
                      <span className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.16em] uppercase">
                        /vote
                      </span>
                    </Link>
                    <Link
                      href="/candidates"
                      className="border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 transition-colors"
                    >
                      <span>Lihat daftar kandidat</span>
                      <span className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.16em] uppercase">
                        /candidates
                      </span>
                    </Link>
                    <Link
                      href="/results"
                      className="border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 transition-colors"
                    >
                      <span>Cek hasil penghitungan</span>
                      <span className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.16em] uppercase">
                        /results
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
