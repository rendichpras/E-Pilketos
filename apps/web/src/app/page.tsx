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
      label: "Belum ada pemilihan",
      description: "Saat ini belum ada pemilihan yang aktif."
    };
  }

  const start = new Date(election.startAt);
  const end = new Date(election.endAt);

  if (now < start) {
    return {
      status: "UPCOMING" as const,
      label: "Akan dibuka",
      description: "Pemilihan akan dibuka sesuai jadwal. Anda bisa melihat paslon lebih dulu."
    };
  }

  if (now >= start && now <= end) {
    return {
      status: "OPEN" as const,
      label: "Dibuka",
      description: "Bilik suara terbuka. Masukkan token Anda untuk memilih."
    };
  }

  return {
    status: "CLOSED" as const,
    label: "Ditutup",
    description: "Pemilihan telah ditutup. Menunggu publikasi hasil dari panitia."
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
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
            <Info className="h-4 w-4" />
            <span>Status hari ini</span>
          </div>
          <Badge variant={badgeVariant} className="text-[11px]">
            {label}
          </Badge>
        </div>

        <CardTitle className="text-lg">{election?.name ?? "Belum ada pemilihan aktif"}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Dibuka</div>
            <div className="bg-muted/40 rounded-md border px-3 py-2 text-xs">
              {startAt ? fmtJakarta(startAt) : "Belum dijadwalkan"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Ditutup</div>
            <div className="bg-muted/40 rounded-md border px-3 py-2 text-xs">
              {endAt ? fmtJakarta(endAt) : "Belum dijadwalkan"}
            </div>
          </div>
        </div>

        {status === "OPEN" ? (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Berjalan</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        ) : null}

        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4" />
            <p className="leading-relaxed">
              Token bersifat sekali pakai. Setelah suara dikirim, sesi Anda otomatis berakhir.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="text-muted-foreground flex items-center justify-between border-t text-xs">
        <span>Diperbarui</span>
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
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base md:text-lg">
              Paslon {candidate.number} — {title}
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">{electionName ?? "Profil paslon"}</div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <AspectRatio ratio={3 / 4} className="bg-muted/40 overflow-hidden rounded-lg border">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={`Foto ${title}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    Foto belum tersedia
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
    <Card
      className={`$"border-border/80 bg-card/95 shadow-sm" flex h-full flex-col overflow-hidden`}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={3 / 4} className="bg-muted/40">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={`Foto ${title}`}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
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
          Lihat visi, misi, dan program lewat tombol Detail.
        </p>
      </CardContent>

      <CardFooter className="mt-auto w-full justify-end gap-2 border-t">
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
              <span>Paslon</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {electionName ?? "Daftar Paslon"}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Kenali kandidat lebih dulu. Saat bilik suara dibuka, Anda bisa memilih dengan token.
            </p>
          </div>
        </div>

        {!hasCandidates ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Paslon belum dipublikasikan untuk pemilihan ini.
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
      desc: "Gunakan token dari panitia. Token hanya bisa dipakai satu kali."
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Pilih paslon",
      desc: "Buka detail, bandingkan visi–misi, lalu tentukan pilihan."
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: "Konfirmasi & kirim",
      desc: "Pastikan pilihan benar, lalu kirim suara untuk menyelesaikan proses."
    }
  ];

  return (
    <section id="cara-memilih" className="bg-muted/30 border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 space-y-2">
          <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Cara memilih</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Selesai dalam tiga langkah.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Alurnya singkat, supaya pemilihan tetap cepat dan tertib.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title} className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader>
                <div className="bg-background/60 flex h-9 w-9 items-center justify-center rounded-full border">
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
              Jika token tidak valid atau sudah dipakai, hubungi panitia untuk pengecekan.
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
          <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Info className="h-3.5 w-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Bantuan cepat.</h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Beberapa jawaban singkat untuk kasus yang paling sering terjadi.
          </p>
        </div>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="token-invalid">
                <AccordionTrigger>
                  Token saya tidak valid. Apa yang harus saya lakukan?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Periksa penulisan token (tanpa spasi). Jika masih gagal, hubungi panitia untuk
                  verifikasi.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="token-used">
                <AccordionTrigger>
                  Token saya sudah digunakan. Bagaimana solusinya?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Token hanya bisa dipakai sekali. Hubungi panitia agar dilakukan pengecekan dan
                  tindak lanjut sesuai prosedur.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="session-expired">
                <AccordionTrigger>Sesi habis saat memilih. Kenapa bisa begitu?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Silakan masuk ulang dari halaman token. Pastikan koneksi stabil saat proses
                  pemilihan.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="results">
                <AccordionTrigger>Kenapa hasil belum muncul?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Hasil akan tampil setelah panitia mempublikasikan rekap setelah sesi pemilihan
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
    <div className="bg-background/90 supports-[backdrop-filter]:bg-background/70 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
          <LockKeyholeOpen className="h-4 w-4" />
          <span>Bilik suara terbuka</span>
        </div>
        <Button asChild>
          <Link href="/vote">Masuk</Link>
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
        ? "Sudah ditutup"
        : statusInfo.status === "NONE"
          ? "Belum ada pemilihan"
          : "Masuk bilik suara";

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
                  Pemilihan Ketua & Wakil OSIS
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  Siapkan token dari panitia untuk masuk ke bilik suara. Token hanya bisa dipakai
                  satu kali.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {voteEnabled ? (
                  <Button asChild size="lg">
                    <Link href="/vote">Masuk Bilik Suara</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled title={voteDisabledLabel}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    {voteDisabledLabel}
                  </Button>
                )}

                <Button asChild size="lg" variant="outline">
                  <Link href="/#kandidat">Lihat Paslon</Link>
                </Button>
              </div>
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
