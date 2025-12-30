import Link from "next/link";

import { publicGet, ServerApiError } from "@/lib/api/server";
import type { Election, PublicResultsResponse } from "@/shared/types";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AlertCircle, BarChart3, CalendarX2, LockKeyhole } from "lucide-react";

import { VotesBarChart, type VotesChartDatum } from "./chart";

export const dynamic = "force-dynamic";

type FetchResult = {
  status: number;
  data: PublicResultsResponse | null;
  error?: string | null;
} | null;

async function getResults(): Promise<FetchResult> {
  try {
    const data = await publicGet<PublicResultsResponse>("/public/results", {
      cache: "no-store"
    });
    return { status: 200, data, error: null };
  } catch (err) {
    if (err instanceof ServerApiError) {
      return { status: err.status, data: null, error: err.message };
    }
    return null;
  }
}

function fmtNumber(n: number) {
  return n.toLocaleString("id-ID");
}

function fmtJakarta(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(d);
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 md:px-6">
      <Card className="bg-muted/30 w-full max-w-md border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center text-sm">
          <div className="bg-background/60 text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full border">
            {icon}
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold">{title}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>

          {action ? (
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

type Ranked = {
  id: string;
  number: number;
  shortName: string | null;
  votes: number;
};

function buildRanked(data: PublicResultsResponse) {
  const totalVotes = Number(data.totalVotes ?? 0);

  const ranked: Ranked[] = (data.results ?? [])
    .map((r) => ({
      id: r.candidate.id,
      number: r.candidate.number,
      shortName: r.candidate.shortName ?? null,
      votes: r.voteCount
    }))
    .sort((a, b) => b.votes - a.votes || a.number - b.number);

  const maxVotes = ranked.length ? Math.max(...ranked.map((x) => x.votes)) : 0;
  const leaders = maxVotes > 0 ? ranked.filter((x) => x.votes === maxVotes) : [];

  return { totalVotes, ranked, maxVotes, leaders };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function PublicResultsPage() {
  const result = await getResults();

  if (!result) {
    return (
      <PageShell>
        <StateCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Gagal memuat hasil."
          description="Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi."
          action={{ label: "Kembali ke Beranda", href: "/" }}
        />
      </PageShell>
    );
  }

  if (result.status === 403) {
    return (
      <PageShell>
        <StateCard
          icon={<LockKeyhole className="h-6 w-6" />}
          title="Hasil belum dipublikasikan."
          description={result.error ?? "Panitia belum membuka akses hasil untuk publik."}
          action={{ label: "Kembali ke Beranda", href: "/" }}
        />
      </PageShell>
    );
  }

  if (result.status === 200 && result.data && !result.data.election) {
    return (
      <PageShell>
        <StateCard
          icon={<CalendarX2 className="h-6 w-6" />}
          title="Belum ada hasil yang tersedia."
          description="Saat ini tidak ada pemilihan yang hasilnya sudah dipublikasikan."
          action={{ label: "Kembali ke Beranda", href: "/" }}
        />
      </PageShell>
    );
  }

  if (!result.data || !result.data.election) {
    return (
      <PageShell>
        <StateCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Hasil belum dapat ditampilkan."
          description={
            result.error
              ? result.error
              : "Coba lagi nanti. Jika masalah berlanjut, hubungi panitia."
          }
          action={{ label: "Kembali ke Beranda", href: "/" }}
        />
      </PageShell>
    );
  }

  const election: Election = result.data.election;
  const now = new Date();

  const { totalVotes, ranked, maxVotes } = buildRanked(result.data);

  const chartData: VotesChartDatum[] = ranked.map((c) => {
    const percent = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
    const axis = `#${pad2(c.number)}`;
    return {
      id: c.id,
      number: c.number,
      name: c.shortName || `Paslon ${c.number}`,
      axis,
      votes: c.votes,
      percent
    };
  });

  return (
    <PageShell>
      <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10 lg:py-14">
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Hasil Pemilihan</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{election.name}</h1>
              <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                Ringkasan hasil untuk publik. Ketuk bar pada grafik untuk melihat detail paslon.
              </p>
              <p className="text-muted-foreground text-xs">
                Diperbarui: <span className="text-foreground font-medium">{fmtJakarta(now)}</span>
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-6 md:my-8" />

        {ranked.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Belum ada paslon terdaftar, sehingga hasil tidak dapat ditampilkan.
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">Perolehan suara</CardTitle>
                  <CardDescription className="text-sm">
                    Grafik batang vertikal untuk semua paslon.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <VotesBarChart
                  data={chartData}
                  maxVotes={maxVotes}
                  emptyLabel="Belum ada suara masuk. Grafik akan terisi setelah rekap berjalan."
                />

                <div className="text-muted-foreground flex justify-end text-xs">
                  Total suara masuk:
                  <span className="text-foreground ml-1 font-medium">{fmtNumber(totalVotes)}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </PageShell>
  );
}
