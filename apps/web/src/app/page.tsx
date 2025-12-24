import type { ReactNode } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import type { PublicActiveElectionResponse } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Info,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Users
} from "lucide-react";

async function getActiveElection() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/elections/active`, {
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data: PublicActiveElectionResponse = await res.json();
    return data.activeElection;
  } catch {
    return null;
  }
}

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-muted/60 bg-background/60">
      <CardHeader className="space-y-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border">{icon}</div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

type StepCardProps = {
  step: string;
  title: string;
  description: string;
};

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <Card className="border-muted/60 bg-background/60">
      <CardHeader className="space-y-2">
        <span className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          {step}
        </span>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function HomePage() {
  const election = await getActiveElection();
  const now = new Date();

  let statusLabel = "Tidak Aktif";
  let statusDesc = "Belum ada agenda pemilihan saat ini.";
  let badgeVariant: "outline" | "default" | "secondary" = "outline";
  let alertVariant: "default" | "destructive" = "default";

  if (election) {
    const start = new Date(election.startAt);
    const end = new Date(election.endAt);

    if (now < start) {
      statusLabel = "Akan Datang";
      statusDesc = "Pemilihan belum dimulai. Harap tunggu jadwal resmi dari panitia.";
      badgeVariant = "secondary";
    } else if (now >= start && now <= end) {
      statusLabel = "Sedang Berlangsung";
      statusDesc = "Bilik suara sedang dibuka. Silakan gunakan token Anda untuk memilih.";
      badgeVariant = "default";
    } else {
      statusLabel = "Selesai";
      statusDesc = "Sesi pemilihan telah berakhir. Hasil dapat direkap oleh panitia.";
      badgeVariant = "secondary";
    }

    if (now > end) {
      alertVariant = "destructive";
    }
  }

  const startAt = election ? new Date(election.startAt) : null;
  const endAt = election ? new Date(election.endAt) : null;

  let progressValue = 0;
  if (election && startAt && endAt && now >= startAt && now <= endAt) {
    const total = endAt.getTime() - startAt.getTime();
    const elapsed = now.getTime() - startAt.getTime();
    progressValue = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <TooltipProvider>
          <section className="border-b">
            <div className="container mx-auto grid max-w-5xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:py-20">
              <div className="flex flex-col gap-6 text-left">
                <div className="inline-flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-dashed px-3 py-1 font-mono text-xs tracking-[0.18em] uppercase"
                  >
                    E-Pilketos System
                  </Badge>
                  {election && (
                    <Badge
                      variant="secondary"
                      className="font-mono text-[0.7rem] tracking-[0.16em] uppercase"
                    >
                      #{election.slug ?? "pilketos"}
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-balance lg:text-5xl xl:text-6xl">
                    Suara Anda,
                    <span className="text-foreground/80 block font-mono">Masa Depan Kita.</span>
                  </h1>
                  <p className="text-muted-foreground max-w-xl text-base md:text-lg">
                    Platform pemilihan digital berbasis token untuk pemilihan ketua OSIS yang aman,
                    jujur, dan transparan. Tanpa manipulasi, hasil real-time, dan jejak audit yang
                    jelas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {election ? (
                    <Button asChild size="lg">
                      <Link href="/vote" className="font-mono text-sm">
                        Mulai Memilih
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" disabled className="font-mono text-sm">
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Pemilihan Belum Dibuka
                    </Button>
                  )}

                  <Button asChild variant="secondary" size="lg">
                    <Link href="/candidates" className="font-mono text-sm">
                      Lihat Kandidat
                    </Link>
                  </Button>

                  <div className="text-muted-foreground hidden flex-1 flex-col gap-1 text-xs sm:flex">
                    <span className="font-mono tracking-[0.18em] uppercase">
                      dirancang untuk pilketos
                    </span>
                    <span>
                      Mengurangi kertas, mempercepat rekapitulasi, dan menjaga integritas suara
                      siswa.
                    </span>
                  </div>
                </div>

                <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span className="font-mono tracking-[0.16em] uppercase">
                          verifikasi token
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Setiap token unik dan hanya bisa digunakan satu kali.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        <span className="font-mono tracking-[0.16em] uppercase">
                          hasil real-time
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Panitia dapat memonitor progres perolehan suara saat itu juga.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                      >
                        <Users className="h-3 w-3" />
                        <span className="font-mono tracking-[0.16em] uppercase">
                          satu siswa, satu suara
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Sistem memastikan tidak ada penggandaan suara.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Card className="border-primary/15 bg-background/70 shadow-sm backdrop-blur">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Info className="h-4 w-4" />
                      <span className="font-mono tracking-[0.18em] uppercase">status sistem</span>
                    </div>
                    <Badge
                      variant={badgeVariant}
                      className="font-mono text-[0.65rem] tracking-[0.16em] uppercase"
                    >
                      {statusLabel}
                    </Badge>
                  </div>

                  <Alert variant={alertVariant}>
                    <AlertTitle className="text-sm font-semibold">
                      {election ? election.name : "Belum ada agenda pemilihan"}
                    </AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      {statusDesc}
                    </AlertDescription>
                  </Alert>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />

                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                        Mulai
                      </span>
                      <div className="bg-muted/40 rounded-md border px-3 py-2 font-mono text-xs">
                        {startAt ? startAt.toLocaleString("id-ID") : "Belum dijadwalkan"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                        Selesai
                      </span>
                      <div className="bg-muted/40 rounded-md border px-3 py-2 font-mono text-xs">
                        {endAt ? endAt.toLocaleString("id-ID") : "Belum dijadwalkan"}
                      </div>
                    </div>
                  </div>

                  {election && startAt && endAt && (
                    <div className="space-y-2">
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span className="font-mono tracking-[0.16em] uppercase">progres sesi</span>
                        <span className="font-mono">{progressValue.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-1.5" />
                    </div>
                  )}

                  {election && (
                    <Alert className="bg-muted/40 border-dashed text-xs">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-muted-foreground leading-relaxed">
                        Pastikan Anda menggunakan token sebelum sesi pemilihan berakhir. Setelah
                        waktu berakhir, sistem akan menutup bilik suara secara otomatis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>

                <CardFooter className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono tracking-[0.18em] uppercase">terakhir diperbarui</span>
                  <span>{now.toLocaleString("id-ID")}</span>
                </CardFooter>
              </Card>
            </div>
          </section>

          <section className="bg-muted/40">
            <div className="container mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-16">
              <div className="mb-10 space-y-3 text-center">
                <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                  kenapa e-pilketos
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                  Transparan untuk panitia, sederhana untuk siswa.
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
                  Dibangun untuk alur pemilihan di sekolah: dari pembagian token hingga rekap suara
                  akhir, semuanya tercatat dengan rapi dan bisa diaudit.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FeatureCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Token Terverifikasi"
                  description="Setiap siswa mendapatkan token unik sehingga tidak ada penggandaan suara dan semua akses tercatat."
                />
                <FeatureCard
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Rekap Real-time"
                  description="Panitia dapat memantau jumlah partisipan dan hasil sementara tanpa menunggu penghitungan manual."
                />
                <FeatureCard
                  icon={<Users className="h-4 w-4" />}
                  title="Sesuai Prosedur Sekolah"
                  description="Alur pemilihan mengikuti SOP panitia OSIS dan mudah disesuaikan dengan aturan di masing-masing sekolah."
                />
              </div>
            </div>
          </section>

          <section>
            <div className="container mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-16">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-md space-y-4">
                  <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                    alur pemilihan
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Dari token ke hasil akhir, dalam empat langkah.
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Jelaskan alur ini kepada siswa sebelum hari-H agar proses pemilihan berjalan
                    cepat, tertib, dan minim pertanyaan di bilik suara.
                  </p>
                  <div className="text-muted-foreground mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Cocok untuk simulasi sebelum pemilihan utama di hari berikutnya.</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <Tabs defaultValue="siswa" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="siswa"
                        className="font-mono text-xs tracking-[0.16em] uppercase"
                      >
                        Alur Siswa
                      </TabsTrigger>
                      <TabsTrigger
                        value="panitia"
                        className="font-mono text-xs tracking-[0.16em] uppercase"
                      >
                        Alur Panitia
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="siswa" className="mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <StepCard
                          step="langkah 01"
                          title="Menerima Token"
                          description="Siswa menerima token unik dari panitia sesuai daftar hadir."
                        />
                        <StepCard
                          step="langkah 02"
                          title="Akses Halaman"
                          description="Siswa membuka halaman pemilihan dan memasukkan token untuk verifikasi."
                        />
                        <StepCard
                          step="langkah 03"
                          title="Memilih Kandidat"
                          description="Siswa membaca profil kandidat, memilih, dan mengirim suara."
                        />
                        <StepCard
                          step="langkah 04"
                          title="Selesai"
                          description="Siswa mendapatkan konfirmasi bahwa suaranya tercatat."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="panitia" className="mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <StepCard
                          step="langkah 01"
                          title="Siapkan Data"
                          description="Panitia mengatur daftar pemilih, kandidat, dan jadwal pemilihan di sistem."
                        />
                        <StepCard
                          step="langkah 02"
                          title="Distribusi Token"
                          description="Token unik dicetak atau dibagikan ke setiap siswa sesuai daftar hadir."
                        />
                        <StepCard
                          step="langkah 03"
                          title="Monitoring"
                          description="Selama pemilihan, panitia memantau progres partisipasi dan memastikan tidak ada kendala teknis."
                        />
                        <StepCard
                          step="langkah 04"
                          title="Rekap & Arsip"
                          description="Setelah sesi berakhir, panitia mengunduh hasil resmi dan mengarsipkan laporan pemilihan."
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Alert className="bg-muted/40 mt-2 border-dashed text-xs">
                    <ListChecks className="h-4 w-4" />
                    <AlertDescription className="text-muted-foreground leading-relaxed">
                      Gunakan alur ini sebagai bahan sosialisasi di kelas atau saat technical
                      meeting sebelum hari pelaksanaan.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </section>
        </TooltipProvider>
      </main>

      <Footer />
    </div>
  );
}
