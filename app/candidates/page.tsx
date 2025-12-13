import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import type { PublicCandidatesResponse } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

async function getCandidates() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/candidates`, {
      cache: "no-store"
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicCandidatesResponse;
  } catch {
    return null;
  }
}

export default async function CandidatesPage() {
  const data = await getCandidates();
  const election = data?.election;
  const candidates = data?.candidates ?? [];
  const hasCandidates = candidates.length > 0;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
          <section className="mb-8 space-y-4">
            <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="font-mono tracking-[0.18em] uppercase">daftar pasangan calon</span>
            </div>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {election?.name ?? "Data Kandidat"}
                </h1>
                <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                  Lihat profil singkat setiap pasangan calon sebelum Anda memasuki bilik suara dan
                  menentukan pilihan.
                </p>
              </div>

              <div className="text-muted-foreground flex flex-col items-start gap-2 text-xs md:items-end">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono tracking-[0.16em] uppercase">
                    {hasCandidates ? `${candidates.length} paslon terdaftar` : "Belum ada paslon"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-[11px] md:inline">Siap masuk ke bilik suara?</span>
                  <Button
                    asChild
                    size="sm"
                    className="font-mono text-[11px] tracking-[0.16em] uppercase"
                  >
                    <Link href="/vote">Masuk ke Bilik Suara</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {!hasCandidates ? (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm">
                <p className="text-muted-foreground">
                  Belum ada kandidat yang terdaftar untuk pemilihan ini.
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Hubungi panitia atau administrator jika ini adalah sebuah kesalahan.
                </p>
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {candidates.map((candidate) => (
                  <Card key={candidate.id} className="border-border/80 bg-card/95 flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold md:h-14 md:w-14">
                        {candidate.number}
                      </div>
                      <div className="space-y-1">
                        <CardDescription className="font-mono text-[11px] tracking-[0.18em] uppercase">
                          pasangan calon
                        </CardDescription>
                        <CardTitle className="text-lg md:text-xl">
                          {candidate.shortName || `Paslon ${candidate.number}`}
                        </CardTitle>
                        {election?.name && (
                          <p className="text-muted-foreground text-[11px]">{election.name}</p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="mb-1 text-[10px] tracking-[0.16em] uppercase"
                          >
                            Ketua
                          </Badge>
                          <p className="leading-tight font-semibold">{candidate.ketuaName}</p>
                          <p className="text-muted-foreground text-xs">{candidate.ketuaClass}</p>
                        </div>
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="mb-1 text-[10px] tracking-[0.16em] uppercase"
                          >
                            Wakil
                          </Badge>
                          <p className="leading-tight font-semibold">{candidate.wakilName}</p>
                          <p className="text-muted-foreground text-xs">{candidate.wakilClass}</p>
                        </div>
                      </div>

                      {(candidate.vision || candidate.mission) && (
                        <>
                          <Separator />
                          <div className="space-y-3 text-xs md:text-sm">
                            {candidate.vision && (
                              <div className="space-y-1">
                                <span className="text-primary font-mono text-[11px] tracking-[0.18em] uppercase">
                                  visi
                                </span>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {candidate.vision}
                                </p>
                              </div>
                            )}
                            {candidate.mission && (
                              <div className="space-y-1">
                                <span className="text-primary font-mono text-[11px] tracking-[0.18em] uppercase">
                                  misi
                                </span>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {candidate.mission}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
