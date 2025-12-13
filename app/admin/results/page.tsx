"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { AdminResultsResponse, Election } from "@/lib/types";
import { cn } from "@/lib/cn";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { BarChart3, RefreshCw, Trophy, Users2, KeyRound } from "lucide-react";

type PageState = {
  loading: boolean;
  error: string | null;
  elections: Election[];
  selectedElectionId: string | null;
  results: AdminResultsResponse | null;
};

function fmtId(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminResultsPage() {
  const [page, setPage] = useState<PageState>({
    loading: true,
    error: null,
    elections: [],
    selectedElectionId: null,
    results: null
  });

  async function loadResults(electionId: string) {
    try {
      const res = await apiClient.get<AdminResultsResponse>(`/admin/results/${electionId}`);
      setPage((prev) => ({ ...prev, results: res, error: null }));
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal memuat hasil.";
      setPage((prev) => ({ ...prev, error: message, results: null }));
      toast.error(message);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const elections = await apiClient.get<Election[]>("/admin/elections");

        const defaultElection =
          elections.find((e) => e.status === "ACTIVE") ??
          elections.find((e) => e.status === "CLOSED") ??
          elections[0] ??
          null;

        if (cancelled) return;

        setPage((prev) => ({
          ...prev,
          elections,
          selectedElectionId: defaultElection?.id ?? null,
          loading: false
        }));

        if (defaultElection?.id) {
          await loadResults(defaultElection.id);
        }
      } catch (err: any) {
        if (cancelled) return;
        const message = err?.data?.error ?? "Gagal memuat daftar pemilihan.";
        setPage((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedElection = useMemo(
    () => page.elections.find((e) => e.id === page.selectedElectionId) ?? null,
    [page.elections, page.selectedElectionId]
  );

  const totalVotes = page.results?.summary.totalVotes ?? 0;

  const sortedCandidates = useMemo(() => {
    const cands = page.results?.candidates ?? [];
    return cands.slice().sort((a, b) => b.totalVotes - a.totalVotes);
  }, [page.results]);

  async function onElectionChange(id: string) {
    setPage((prev) => ({
      ...prev,
      selectedElectionId: id || null,
      results: null,
      error: null
    }));

    if (id) {
      await loadResults(id);
    }
  }

  async function refresh() {
    if (!page.selectedElectionId) return;
    await loadResults(page.selectedElectionId);
  }

  if (page.loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </header>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="border-border/60 border-b pb-3">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
          rekapitulasi
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <BarChart3 className="h-6 w-6" />
              Hasil pemilihan
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Rekap suara tiap calon dan ringkasan penggunaan token.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={refresh}
              disabled={!page.selectedElectionId}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {page.error && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="text-sm">Terjadi kesalahan</AlertTitle>
          <AlertDescription className="text-xs">{page.error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Pemilihan</CardTitle>
              <CardDescription className="text-xs">
                Pilih pemilihan untuk melihat rekap hasil dan penggunaan token.
              </CardDescription>
            </div>

            <div className="w-full md:max-w-md">
              <Select
                value={page.selectedElectionId ?? ""}
                onValueChange={onElectionChange}
                disabled={page.elections.length === 0}
              >
                <SelectTrigger className="h-9 w-full min-w-0 text-xs [&_[data-slot='select-value']]:truncate">
                  <SelectValue placeholder="Tidak ada pemilihan" />
                </SelectTrigger>
                <SelectContent>
                  {page.elections.length === 0 && (
                    <SelectItem value="__no_elections__" disabled>
                      Tidak ada pemilihan
                    </SelectItem>
                  )}
                  {page.elections.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.name} ({e.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedElection ? (
                <div className="text-muted-foreground mt-2 flex min-w-0 items-center gap-2 overflow-hidden text-[11px]">
                  <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                    {selectedElection.status}
                  </Badge>
                  <span className="min-w-0 truncate">{selectedElection.name}</span>
                </div>
              ) : null}
            </div>
          </div>

          {page.results ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                Token: {page.results.summary.totalTokens}
              </Badge>
              <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                Used: {page.results.summary.usedTokens}
              </Badge>
              <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                Unused: {page.results.summary.unusedTokens}
              </Badge>
              <Badge
                variant="outline"
                className="border-destructive/60 bg-destructive/10 text-destructive rounded-full text-[11px] font-medium"
              >
                Invalid: {page.results.summary.invalidTokens}
              </Badge>
              <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                <Users2 className="mr-1 h-3.5 w-3.5" />
                Total suara: {page.results.summary.totalVotes}
              </Badge>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {!page.selectedElectionId ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm">
              Buat/pilih pemilihan terlebih dahulu untuk mengelola kandidat.
            </div>
          ) : !page.results ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : page.results.candidates.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
              <Trophy className="text-muted-foreground h-8 w-8" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Belum ada data hasil</p>
                <p className="text-muted-foreground text-xs">
                  Hasil akan muncul setelah ada voting yang masuk.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* MOBILE: card list (tanpa overlap) */}
              <div className="sm:hidden">
                <div className="text-muted-foreground mb-2 text-[11px]">
                  update: {fmtId(page.results.election.updatedAt)}
                </div>

                <div className="space-y-2">
                  {sortedCandidates.map((c, idx) => {
                    const pct =
                      totalVotes > 0 ? Math.round((c.totalVotes / totalVotes) * 1000) / 10 : 0;

                    return (
                      <div
                        key={c.candidateId}
                        className={cn(
                          "border-border/60 rounded-2xl border p-4",
                          idx === 0 && "bg-emerald-500/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="rounded-full text-xs">
                            {c.number}
                          </Badge>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-semibold">{c.shortName}</p>
                              {idx === 0 ? (
                                <Badge className="rounded-full bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10">
                                  Teratas
                                </Badge>
                              ) : null}
                            </div>

                            <div className="text-muted-foreground text-[11px] leading-snug">
                              Ketua:{" "}
                              <span className="text-foreground font-medium">{c.ketuaName}</span>
                            </div>
                            <div className="text-muted-foreground text-[11px] leading-snug">
                              Wakil:{" "}
                              <span className="text-foreground font-medium">{c.wakilName}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base leading-none font-semibold">
                              {c.totalVotes}
                            </div>
                            <div className="text-muted-foreground text-[11px]">suara</div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                            <span>{pct}%</span>
                            <span className="font-mono">
                              {totalVotes > 0 ? `${c.totalVotes}/${totalVotes}` : "-"}
                            </span>
                          </div>
                          <Progress value={pct} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DESKTOP: table */}
              <div className="border-border/60 hidden overflow-x-auto rounded-2xl border sm:block">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[70px] text-xs">No</TableHead>
                      <TableHead className="text-xs">Paslon</TableHead>
                      <TableHead className="w-[140px] text-right text-xs">Suara</TableHead>
                      <TableHead className="w-[220px] text-xs">Persent</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedCandidates.map((c, idx) => {
                      const pct =
                        totalVotes > 0 ? Math.round((c.totalVotes / totalVotes) * 1000) / 10 : 0;

                      return (
                        <TableRow
                          key={c.candidateId}
                          className={cn(idx === 0 && "bg-emerald-500/5")}
                        >
                          <TableCell className="align-top">
                            <Badge variant="outline" className="rounded-full text-xs">
                              {c.number}
                            </Badge>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{c.shortName}</p>
                                {idx === 0 ? (
                                  <Badge className="rounded-full bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10">
                                    Teratas
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="text-muted-foreground text-[11px]">
                                Ketua:{" "}
                                <span className="text-foreground font-medium">{c.ketuaName}</span> •
                                Wakil:{" "}
                                <span className="text-foreground font-medium">{c.wakilName}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right align-top">
                            <div className="text-sm font-semibold">{c.totalVotes}</div>
                            <div className="text-muted-foreground text-[11px]">
                              update: {fmtId(page.results!.election.updatedAt)}
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                                <span>{pct}%</span>
                                <span className="font-mono">
                                  {totalVotes > 0 ? `${c.totalVotes}/${totalVotes}` : "-"}
                                </span>
                              </div>
                              <Progress value={pct} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>

        {page.results ? (
          <CardFooter className="border-border/60 text-muted-foreground border-t pt-4 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span>Pemilihan:</span>
              <span className="font-medium">{page.results.election.slug}</span>
              <span className="mx-1">•</span>
              <span>Status:</span>
              <span className="font-medium">{page.results.election.status}</span>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
