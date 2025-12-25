import Link from "next/link";

import { API_BASE_URL } from "@/lib/config";
import type { Election, PublicResultsResponse } from "@/lib/types";
import { cn } from "@/lib/cn";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { AlertCircle, BarChart3, CalendarX2, LockKeyhole, RefreshCcw, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

type FetchResult =
  | {
    status: number;
    data: PublicResultsResponse | null;
    error?: string | null;
  }
  | null;

async function getResults(): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/results`, { cache: "no-store" });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      return { status: res.status, data: null, error: payload?.error ?? null };
    }

    return { status: 200, data: (await res.json()) as PublicResultsResponse, error: null };
  } catch {
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
      <Card className="bg-muted/40 w-full max-w-md border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center text-sm">
          <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
            {icon}
          </div>
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>

          {action ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-2 font-mono text-[11px] tracking-[0.16em] uppercase"
            >
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
      number: Number((r.candidate as any).number ?? 0),
      shortName: (r.candidate as any).shortName ?? null,
      votes: Number((r as any).voteCount ?? 0)
    }))
    .sort((a, b) => b.votes - a.votes || a.number - b.number);

  const maxVotes = ranked.length ? Math.max(...ranked.map((x) => x.votes)) : 0;
  const leaders = maxVotes > 0 ? ranked.filter((x) => x.votes === maxVotes) : [];
  const secondVotes =
    ranked.length >= 2 ? ranked.filter((x) => x.votes < maxVotes).map((x) => x.votes)[0] ?? 0 : 0;

  const margin = maxVotes > 0 && leaders.length === 1 ? Math.max(0, maxVotes - secondVotes) : 0;

  return { totalVotes, ranked, maxVotes, leaders, margin };
}

export default async function PublicResultsPage() {
  const result = await getResults();

  if (!result) {
    return (
      <PageShell>
        <StateCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Tidak dapat terhubung ke server."
          description="Periksa koneksi Anda dan coba beberapa saat lagi."
          action={{ label: "Kembali", href: "/" }}
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
          description={result.error ?? "Panitia belum membuka akses rekapitulasi hasil."}
          action={{ label: "Kembali", href: "/" }}
        />
      </PageShell>
    );
  }

  if (result.status === 200 && result.data && !result.data.election) {
    return (
      <PageShell>
        <StateCard
          icon={<CalendarX2 className="h-6 w-6" />}
          title="Belum ada hasil pemilihan yang tersedia."
          description="Tidak ada pemilihan yang hasilnya sudah dipublikasikan saat ini."
          action={{ label: "Kembali", href: "/" }}
        />
      </PageShell>
    );
  }

  if (!result.data || !result.data.election) {
    return (
      <PageShell>
        <StateCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Data hasil pemilihan belum dapat ditampilkan."
          description={
            result.error
              ? result.error
              : "Coba beberapa saat lagi atau hubungi panitia jika masalah terus berlanjut."
          }
          action={{ label: "Kembali", href: "/" }}
        />
      </PageShell>
    );
  }

  const election: Election = result.data.election;
  const now = new Date();

  const { totalVotes, ranked, maxVotes, leaders, margin } = buildRanked(result.data);

  const hasVotes = totalVotes > 0;
  const isTie = hasVotes && leaders.length > 1;

  const leaderLabel = !hasVotes ? "Belum ada suara" : isTie ? "Teratas (seri)" : "Unggul";

  const leaderName = !leaders.length
    ? null
    : leaders.length === 1
      ? leaders[0].shortName || `Paslon ${leaders[0].number}`
      : `${leaders.length} paslon`;

  return (
    <PageShell>
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-6 lg:py-14">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="font-mono tracking-[0.18em] uppercase">hasil pemilihan</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{election.name}</h1>
                <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                  Rekapitulasi perolehan suara per pasangan calon. Persentase dihitung dari total suara yang sudah masuk.
                </p>
                <p className="text-muted-foreground text-xs">
                  Diperbarui: <span className="font-medium text-foreground">{fmtJakarta(now)}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="font-mono text-[11px] tracking-[0.16em] uppercase">
                <Link href="/">
                  Kembali
                </Link>
              </Button>
              <Button asChild className="font-mono text-[11px] tracking-[0.16em] uppercase">
                <Link href="/hasil">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Muat Ulang
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-stretch">
            <Card className="border-border/80 bg-card/95">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Ringkasan</CardTitle>
                  <Badge
                    variant="outline"
                    className="font-mono text-[0.65rem] tracking-[0.16em] uppercase"
                  >
                    {hasVotes ? "Suara Masuk" : "Belum Ada Suara"}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  Total suara yang tercatat dan kandidat teratas saat ini.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">total suara</p>
                  <p className="mt-1 text-2xl font-semibold">{fmtNumber(totalVotes)}</p>
                </div>

                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">jumlah paslon</p>
                  <p className="mt-1 text-2xl font-semibold">{fmtNumber(ranked.length)}</p>
                </div>

                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">{leaderLabel}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">
                    {leaderName ?? "-"}
                  </p>
                  {!isTie && hasVotes ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Margin: <span className="font-medium text-foreground">{fmtNumber(margin)}</span> suara
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-xs">—</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/95">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">Catatan</CardTitle>
                <CardDescription className="text-sm">
                  Hasil bisa berubah selama proses rekap masih berjalan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/10 p-3 text-sm text-muted-foreground">
                  Jika hasil belum tampil, kemungkinan panitia belum membuka publikasi.
                </div>
                <div className="rounded-lg border bg-muted/10 p-3 text-sm text-muted-foreground">
                  Persentase dihitung otomatis dari total suara yang sudah masuk.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {ranked.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Belum ada kandidat yang terdaftar, sehingga hasil tidak dapat ditampilkan.
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight md:text-xl">Perolehan suara</h2>
              {hasVotes ? (
                <Badge variant="outline" className="font-mono text-[11px] tracking-[0.16em] uppercase">
                  {isTie ? "seri" : "live"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-mono text-[11px] tracking-[0.16em] uppercase">
                  kosong
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {ranked.map((c, idx) => {
                const percent = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
                const isTop = hasVotes && c.votes === maxVotes && c.votes > 0;

                return (
                  <Card
                    key={c.id}
                    className={cn(
                      "border-border/80 bg-card/95 overflow-hidden",
                      isTop && "border-primary ring-primary/30 ring-1"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold",
                              isTop ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {c.number}
                          </div>

                          <div className="min-w-0">
                            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                              peringkat #{idx + 1}
                            </p>
                            <CardTitle className="truncate text-lg md:text-xl">
                              {c.shortName || `Paslon ${c.number}`}
                            </CardTitle>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTop ? (
                            <Badge className="flex items-center gap-1 text-[11px]">
                              <Trophy className="h-3 w-3" />
                              {leaderLabel}
                            </Badge>
                          ) : null}

                          <div className="text-right">
                            <p className="text-sm font-semibold">{fmtNumber(c.votes)} suara</p>
                            <p className="text-muted-foreground text-xs">
                              {percent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 pb-4">
                      <Progress value={percent} className="h-2.5" />
                    </CardContent>

                    <CardFooter className="border-t bg-muted/10">
                      <p className="text-muted-foreground text-xs">
                        No. {String(c.number).padStart(2, "0")} - {hasVotes ? "Suara masuk" : "Belum ada suara masuk"}
                      </p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
