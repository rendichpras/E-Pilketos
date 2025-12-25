import Link from "next/link";

import { API_BASE_URL } from "@/lib/config";
import type {
  CandidatePair,
  Election,
  PublicActiveElectionResponse,
  PublicCandidatesResponse
} from "@/lib/types";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  ListOrdered,
  LockKeyhole,
  LockKeyholeOpen,
  ShieldCheck,
  Ticket,
  Users
} from "lucide-react";

type ElectionStatus = "NONE" | "UPCOMING" | "OPEN" | "CLOSED";

function fmtJakarta(dt: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(dt);
}

function getElectionStatus(election: Election | null, now: Date) {
  if (!election) {
    return {
      status: "NONE" as const,
      label: "Tidak aktif",
      description: "Belum ada agenda pemilihan yang sedang berjalan."
    };
  }

  const start = new Date(election.startAt);
  const end = new Date(election.endAt);

  if (now < start) {
    return {
      status: "UPCOMING" as const,
      label: "Belum dibuka",
      description: "Pemilihan belum dimulai. Silakan cek kembali sesuai jadwal panitia."
    };
  }

  if (now >= start && now <= end) {
    return {
      status: "OPEN" as const,
      label: "Sedang berlangsung",
      description: "Bilik suara dibuka. Gunakan token Anda untuk memilih."
    };
  }

  return {
    status: "CLOSED" as const,
    label: "Selesai",
    description: "Sesi pemilihan sudah berakhir. Panitia dapat melakukan rekapitulasi."
  };
}

async function fetchActiveElection(): Promise<Election | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/elections/active`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: PublicActiveElectionResponse = await res.json();
    return data.activeElection ?? null;
  } catch {
    return null;
  }
}

async function fetchPublicCandidates(): Promise<PublicCandidatesResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/candidates`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PublicCandidatesResponse;
  } catch {
    return null;
  }
}

function StatusCard({
  election,
  status,
  label,
  description,
  now
}: {
  election: Election | null;
  status: ElectionStatus;
  label: string;
  description: string;
  now: Date;
}) {
  const startAt = election ? new Date(election.startAt) : null;
  const endAt = election ? new Date(election.endAt) : null;

  const badgeVariant: "default" | "secondary" | "outline" =
    status === "OPEN"
      ? "default"
      : status === "UPCOMING" || status === "CLOSED"
        ? "secondary"
        : "outline";

  let progress = 0;
  if (status === "OPEN" && startAt && endAt) {
    const total = endAt.getTime() - startAt.getTime();
    const elapsed = now.getTime() - startAt.getTime();
    progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
            <Info className="h-4 w-4" />
            <span>Status Pemilihan</span>
          </div>
          <Badge variant={badgeVariant} className="text-[11px]">
            {label}
          </Badge>
        </div>

        <CardTitle className="text-lg">{election?.name ?? "Belum ada agenda pemilihan"}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Mulai</div>
            <div className="bg-muted/40 rounded-md border px-3 py-2 text-xs">
              {startAt ? fmtJakarta(startAt) : "Belum dijadwalkan"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Selesai</div>
            <div className="bg-muted/40 rounded-md border px-3 py-2 text-xs">
              {endAt ? fmtJakarta(endAt) : "Belum dijadwalkan"}
            </div>
          </div>
        </div>

        {status === "OPEN" ? (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Progres sesi</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        ) : null}

        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4" />
            <p className="leading-relaxed">
              Token hanya bisa dipakai sekali. Setelah suara dikirim, sesi otomatis selesai.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="text-muted-foreground flex items-center justify-between text-xs">
        <span>Waktu</span>
        <span>{fmtJakarta(now)}</span>
      </CardFooter>
    </Card>
  );
}

function CandidateDetailDrawer({
  electionName,
  candidate,
  voteEnabled,
  voteDisabledLabel
}: {
  electionName: string | null;
  candidate: CandidatePair;
  voteEnabled: boolean;
  voteDisabledLabel: string;
}) {
  const title = candidate.shortName || `Paslon ${candidate.number}`;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm" variant="secondary" className="min-w-[76px]">
          Detail
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[92vh] p-0">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base md:text-lg">
              Paslon {candidate.number} — {title}
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              {electionName ?? "Detail pasangan calon"}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <AspectRatio ratio={3 / 4} className="bg-muted/40 overflow-hidden rounded-lg border">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={`Foto ${title}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    Tidak ada foto
                  </div>
                )}
              </AspectRatio>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[11px]">
                      Ketua
                    </Badge>
                    <div className="leading-tight font-semibold">{candidate.ketuaName}</div>
                    <div className="text-muted-foreground text-xs">{candidate.ketuaClass}</div>
                  </div>

                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[11px]">
                      Wakil
                    </Badge>
                    <div className="leading-tight font-semibold">{candidate.wakilName}</div>
                    <div className="text-muted-foreground text-xs">{candidate.wakilClass}</div>
                  </div>
                </div>

                <Separator />

                <Tabs defaultValue="visi" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="visi">Visi</TabsTrigger>
                    <TabsTrigger value="misi">Misi</TabsTrigger>
                    <TabsTrigger value="program">Program</TabsTrigger>
                  </TabsList>

                  <TabsContent value="visi" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.vision?.trim() ? candidate.vision : "Belum ada data visi."}
                    </p>
                  </TabsContent>

                  <TabsContent value="misi" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.mission?.trim() ? candidate.mission : "Belum ada data misi."}
                    </p>
                  </TabsContent>

                  <TabsContent value="program" className="mt-4">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {candidate.programs?.trim() ? candidate.programs : "Belum ada data program."}
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <DrawerFooter className="bg-muted/20 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-2">
            {voteEnabled ? (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/vote">Masuk Bilik Suara</Link>
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled
                title={voteDisabledLabel}
                className="w-full sm:w-auto"
              >
                {voteDisabledLabel}
              </Button>
            )}

            <DrawerClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Tutup
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CandidateCard({
  electionName,
  candidate,
  voteEnabled,
  voteDisabledLabel
}: {
  electionName: string | null;
  candidate: CandidatePair;
  voteEnabled: boolean;
  voteDisabledLabel: string;
}) {
  const title = candidate.shortName || `Paslon ${candidate.number}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="p-0">
        <AspectRatio ratio={3 / 4} className="bg-muted/40">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={`Foto ${title}`}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
              Foto belum tersedia
            </div>
          )}
        </AspectRatio>
      </CardContent>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              <span className="text-foreground font-semibold">{candidate.ketuaName}</span>{" "}
              <span className="text-muted-foreground">({candidate.ketuaClass})</span>
              {" · "}
              <span className="text-foreground font-semibold">{candidate.wakilName}</span>{" "}
              <span className="text-muted-foreground">({candidate.wakilClass})</span>
            </CardDescription>
          </div>

          <Badge variant="outline" className="shrink-0 text-[11px]">
            #{candidate.number}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="text-muted-foreground min-h-[40px] text-sm">
          Tekan Detail untuk melihat visi, misi, dan program.
        </p>
      </CardContent>

      <CardFooter className="bg-muted/20 mt-auto w-full justify-end gap-2 border-t px-6 py-3">
        <CandidateDetailDrawer
          electionName={electionName}
          candidate={candidate}
          voteEnabled={voteEnabled}
          voteDisabledLabel={voteDisabledLabel}
        />

        {voteEnabled ? (
          <Button asChild size="sm" className="min-w-[64px]">
            <Link href="/vote">Pilih</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled
            title={voteDisabledLabel}
            className="min-w-[64px]"
          >
            Pilih
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function CandidatesSection({
  electionName,
  candidates,
  voteEnabled,
  voteDisabledLabel
}: {
  electionName: string | null;
  candidates: CandidatePair[];
  voteEnabled: boolean;
  voteDisabledLabel: string;
}) {
  const hasCandidates = candidates.length > 0;

  return (
    <section id="kandidat" className="scroll-mt-24 border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Pasangan Calon</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {electionName ?? "Daftar Kandidat"}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Lihat profil singkat setiap paslon. Jika sudah yakin, masuk ke bilik suara untuk
              memilih.
            </p>
          </div>
        </div>

        {!hasCandidates ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Kandidat belum tersedia untuk pemilihan ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                electionName={electionName}
                candidate={c}
                voteEnabled={voteEnabled}
                voteDisabledLabel={voteDisabledLabel}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowToVoteSection() {
  const steps = [
    {
      icon: <Ticket className="h-4 w-4" />,
      title: "Masukkan token",
      desc: "Token unik dari panitia. Satu token hanya bisa dipakai sekali."
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Pilih paslon",
      desc: "Baca detail kandidat, lalu tentukan pilihan Anda."
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: "Konfirmasi & selesai",
      desc: "Kirim suara. Setelah terkirim, sesi otomatis berakhir."
    }
  ];

  return (
    <section id="cara-memilih" className="bg-muted/30 border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Cara Memilih</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Tiga langkah, selesai.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Alur dibuat sederhana agar pemilihan cepat dan tertib.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                  {s.icon}
                </div>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription className="text-sm">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-dashed p-4 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4" />
            <p className="leading-relaxed">
              Jika token bermasalah (invalid/used), hubungi panitia untuk verifikasi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Info className="h-3.5 w-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Pertanyaan yang sering muncul.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Jawaban singkat untuk mengurangi kebingungan saat hari-H.
          </p>
        </div>

        <Card>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="token-invalid">
                <AccordionTrigger>Token saya tidak valid. Harus bagaimana?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Periksa penulisan token. Jika tetap gagal, hubungi panitia untuk verifikasi token
                  dan daftar hadir.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="token-used">
                <AccordionTrigger>Token saya sudah digunakan.</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Token hanya bisa dipakai sekali. Hubungi panitia agar dilakukan pengecekan dan
                  tindak lanjut sesuai prosedur.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="session-expired">
                <AccordionTrigger>Sesi habis saat memilih.</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Kembali ke halaman token dan login ulang. Pastikan koneksi stabil saat proses
                  pemilihan.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="results">
                <AccordionTrigger>Kenapa hasil belum terlihat?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Hasil hanya muncul jika panitia sudah mempublikasikannya setelah sesi pemilihan
                  ditutup.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StickyVoteCta({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
          <LockKeyholeOpen className="h-4 w-4" />
          <span>Bilik suara dibuka</span>
        </div>
        <Button asChild>
          <Link href="/vote">Mulai</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [activeElection, candidatesData] = await Promise.all([
    fetchActiveElection(),
    fetchPublicCandidates()
  ]);

  const now = new Date();
  const statusInfo = getElectionStatus(activeElection, now);

  const startAt = activeElection ? new Date(activeElection.startAt) : null;
  const endAt = activeElection ? new Date(activeElection.endAt) : null;

  const voteEnabled = Boolean(activeElection && startAt && endAt && now >= startAt && now <= endAt);

  const voteDisabledLabel =
    statusInfo.status === "UPCOMING"
      ? "Belum dibuka"
      : statusInfo.status === "CLOSED"
        ? "Sudah selesai"
        : statusInfo.status === "NONE"
          ? "Tidak aktif"
          : "Mulai memilih";

  const candidates = candidatesData?.candidates ?? [];
  const electionName = candidatesData?.election?.name ?? activeElection?.name ?? null;
  const electionSlug = activeElection?.slug ?? candidatesData?.election?.slug ?? null;

  return (
    <div
      className={
        voteEnabled
          ? "flex min-h-screen flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          : "flex min-h-screen flex-col"
      }
    >
      <Navbar />

      <main className="flex-1">
        <section className="border-b">
          <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={voteEnabled ? "default" : "secondary"} className="text-xs">
                  {statusInfo.label}
                </Badge>
                {electionSlug ? (
                  <Badge variant="outline" className="text-xs">
                    {electionSlug}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl lg:text-6xl">
                  Pemilihan Ketua OSIS
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  Masukkan token untuk memilih. Satu token hanya sekali pakai.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {voteEnabled ? (
                  <Button asChild size="lg">
                    <Link href="/vote">Mulai Memilih</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled title={voteDisabledLabel}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    {voteDisabledLabel}
                  </Button>
                )}

                <Button asChild size="lg" variant="outline">
                  <Link href="/#kandidat">Lihat Kandidat</Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      {electionName ?? "Informasi pemilihan"}
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      Jadwal
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {voteEnabled
                      ? "Bilik suara dibuka sampai waktu berakhir."
                      : statusInfo.status === "UPCOMING"
                        ? "Pemilihan belum dibuka. Anda tetap bisa melihat kandidat."
                        : statusInfo.status === "CLOSED"
                          ? "Pemilihan sudah selesai. Menunggu publikasi hasil dari panitia."
                          : "Belum ada pemilihan aktif saat ini."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-background/60 rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">Mulai</div>
                      <div className="mt-1 text-sm">
                        {startAt ? fmtJakarta(startAt) : "Belum dijadwalkan"}
                      </div>
                    </div>
                    <div className="bg-background/60 rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">Selesai</div>
                      <div className="mt-1 text-sm">
                        {endAt ? fmtJakarta(endAt) : "Belum dijadwalkan"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <StatusCard
              election={activeElection}
              status={statusInfo.status}
              label={statusInfo.label}
              description={statusInfo.description}
              now={now}
            />
          </div>
        </section>

        <CandidatesSection
          electionName={electionName}
          candidates={candidates}
          voteEnabled={voteEnabled}
          voteDisabledLabel={voteDisabledLabel}
        />

        <HowToVoteSection />
        <FaqSection />
        <StickyVoteCta enabled={voteEnabled} />
      </main>

      <Footer />
    </div>
  );
}
