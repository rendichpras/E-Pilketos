import { API_BASE_URL } from "@/lib/config";
import type { PublicResultsResponse, Election } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertCircle, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

async function getResults() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/results`, {
      cache: "no-store"
    });

    if (!res.ok) {
      return { status: res.status, data: null };
    }

    return { status: 200, data: (await res.json()) as PublicResultsResponse };
  } catch {
    return null;
  }
}

export default async function PublicResultsPage() {
  const result = await getResults();

  if (!result || !result.data || !result.data.election) {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center">
          <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6">
            <Card className="bg-muted/40 mx-auto w-full max-w-md border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-8 text-center text-sm">
                <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Data hasil pemilihan belum dapat ditampilkan.</p>
                  <p className="text-muted-foreground text-xs">
                    Coba beberapa saat lagi atau hubungi panitia jika masalah terus berlanjut.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { election, candidates, summary } = result.data;
  const safeElection: Election = election;
  const totalVotes = summary?.totalVotes ?? 0;
  const maxVotes =
    candidates.length > 0 ? Math.max(...candidates.map((c) => Number(c.totalVotes || 0))) : 0;
  const hasVotes = totalVotes > 0;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
          <section className="mb-8 space-y-6">
            <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="font-mono tracking-[0.18em] uppercase">hasil perolehan suara</span>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {safeElection.name}
                </h1>
                <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                  Rekapitulasi perolehan suara sementara untuk setiap pasangan calon. Persentase
                  dihitung berdasarkan total suara yang sudah masuk ke sistem.
                </p>
              </div>

              <Card className="border-border/80 bg-card/95 w-full max-w-sm">
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
                  <CardTitle className="text-lg">
                    {totalVotes.toLocaleString("id-ID")} Suara
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Total suara yang sudah tercatat di sistem hingga saat ini.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          <Separator className="mb-8" />

          {candidates.length === 0 ? (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                Belum ada kandidat yang terdaftar untuk pemilihan ini, sehingga hasil tidak dapat
                ditampilkan.
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {candidates.map((candidate) => {
                  const votes = Number(candidate.totalVotes || 0);
                  const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  const isLeading = votes === maxVotes && votes > 0;

                  return (
                    <Card
                      key={candidate.candidateId}
                      className={cn(
                        "border-border/80 bg-card/95 flex flex-col",
                        isLeading && "border-primary ring-primary/40 dark:border-primary/80 ring-1"
                      )}
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold md:h-12 md:w-12",
                              isLeading
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {candidate.number}
                          </div>
                          <div className="space-y-1">
                            <CardDescription className="font-mono text-[11px] tracking-[0.18em] uppercase">
                              pasangan calon
                            </CardDescription>
                            <CardTitle className="text-lg md:text-xl">
                              {candidate.shortName || `Paslon ${candidate.number}`}
                            </CardTitle>
                          </div>
                        </div>

                        {isLeading && (
                          <Badge className="flex items-center gap-1 text-[11px]">
                            <Trophy className="h-3 w-3" />
                            Unggul
                          </Badge>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4 pt-2 pb-6">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <div className="text-3xl font-semibold">
                              {percent.toFixed(1)}
                              <span className="text-muted-foreground text-lg">%</span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Dari total {totalVotes.toLocaleString("id-ID")} suara masuk.
                            </p>
                          </div>
                          <div className="text-muted-foreground text-right text-xs">
                            <p className="font-medium">{votes.toLocaleString("id-ID")} suara</p>
                            <p>No. {candidate.number.toString().padStart(2, "0")}</p>
                          </div>
                        </div>

                        <Progress value={percent} className="h-2.5" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
