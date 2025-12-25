import Link from "next/link";

import { API_BASE_URL } from "@/lib/config";
import type { Election, PublicResultsResponse } from "@/lib/types";
import { cn } from "@/lib/cn";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { AlertCircle, BarChart3, CalendarX2, LockKeyhole, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

type FetchResult = {
  status: number;
  data: PublicResultsResponse | null;
  error?: string | null;
} | null;

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

function fmtNumber(n: number) {
  return n.toLocaleString("id-ID");
}

function buildRankedCandidates(data: PublicResultsResponse) {
  const totalVotes = Number(data.totalVotes ?? 0);

  const list = (data.results ?? []).map((r) => ({
    id: r.candidate.id,
    number: Number(r.candidate.number ?? 0),
    shortName: r.candidate.shortName ?? null,
    votes: Number(r.voteCount ?? 0)
  }));

  list.sort((a, b) => b.votes - a.votes || a.number - b.number);

  const maxVotes = list.length ? Math.max(...list.map((x) => x.votes)) : 0;
  const topCount = maxVotes > 0 ? list.filter((x) => x.votes === maxVotes).length : 0;

  return { totalVotes, list, maxVotes, topCount };
}

export default async function HasilPage() {
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
  const { totalVotes, list, maxVotes, topCount } = buildRankedCandidates(result.data);

  const hasVotes = totalVotes > 0;
  const leadingLabel = !hasVotes ? "Belum ada suara" : topCount > 1 ? "Teratas (seri)" : "Unggul";

  return (
    <PageShell>
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-6 lg:py-14">
        <section className="space-y-6">
          <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-mono tracking-[0.18em] uppercase">hasil pemilihan</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{election.name}</h1>
              <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                Rekapitulasi perolehan suara untuk setiap pasangan calon. Persentase dihitung dari
                total suara yang sudah masuk.
              </p>
            </div>

            <Card className="border-border/80 bg-card/95">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono tracking-[0.18em] uppercase">
                    status penghitungan
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[0.65rem] tracking-[0.16em] uppercase"
                  >
                    {hasVotes ? "Suara Masuk" : "Belum Ada Suara"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{fmtNumber(totalVotes)} Suara</CardTitle>
                <CardDescription className="text-xs">
                  Total suara yang sudah tercatat di sistem hingga saat ini.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {list.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Belum ada kandidat yang terdaftar untuk pemilihan ini, sehingga hasil tidak dapat
              ditampilkan.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <section className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {list.map((c, idx) => {
                  const percent = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
                  const isTop = hasVotes && c.votes === maxVotes && c.votes > 0;

                  return (
                    <Card
                      key={c.id}
                      className={cn(
                        "border-border/80 bg-card/95 flex flex-col",
                        isTop && "border-primary ring-primary/40 dark:border-primary/80 ring-1"
                      )}
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold md:h-12 md:w-12",
                              isTop
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {c.number}
                          </div>

                          <div className="space-y-1">
                            <CardDescription className="font-mono text-[11px] tracking-[0.18em] uppercase">
                              peringkat #{idx + 1}
                            </CardDescription>
                            <CardTitle className="text-lg md:text-xl">
                              {c.shortName || `Paslon ${c.number}`}
                            </CardTitle>
                          </div>
                        </div>

                        {isTop ? (
                          <Badge className="flex items-center gap-1 text-[11px]">
                            <Trophy className="h-3 w-3" />
                            {leadingLabel}
                          </Badge>
                        ) : null}
                      </CardHeader>

                      <CardContent className="space-y-4 pt-2 pb-6">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <div className="text-3xl font-semibold">
                              {percent.toFixed(1)}
                              <span className="text-muted-foreground text-lg">%</span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Dari total {fmtNumber(totalVotes)} suara masuk.
                            </p>
                          </div>

                          <div className="text-muted-foreground text-right text-xs">
                            <p className="font-medium">{fmtNumber(c.votes)} suara</p>
                            <p>No. {c.number.toString().padStart(2, "0")}</p>
                          </div>
                        </div>

                        <Progress value={percent} className="h-2.5" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <Card className="border-border/80 bg-card/95">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base">Catatan</CardTitle>
                  <CardDescription className="text-sm">
                    Jika hasil masih berubah, panitia mungkin sedang menyelesaikan proses
                    rekapitulasi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/10 text-muted-foreground rounded-lg border p-3 text-sm">
                    Persentase dihitung secara otomatis berdasarkan total suara yang sudah tercatat.
                  </div>
                </CardContent>
              </Card>

              <Button
                asChild
                variant="outline"
                className="w-full font-mono text-[11px] tracking-[0.16em] uppercase"
              >
                <Link href="/">Kembali ke Beranda</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}
