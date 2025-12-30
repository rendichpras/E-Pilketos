"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, RefreshCw } from "lucide-react";

import { useElections } from "@/features/admin/elections/hooks/useElections";
import { useResults } from "./hooks/useResults";
import { ResultsChart } from "./components/ResultsChart";
import { StatsBadges } from "./components/StatsBadges";

export default function AdminResultsPage() {
  const {
    elections,
    loading: electionsLoading,
    refresh: refreshElections,
    error: electionsError
  } = useElections();

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  // Determine default election ID derived from loaded elections
  const defaultElectionId = useMemo(() => {
    if (elections.length === 0) return null;
    const active = elections.find((e) => e.status === "ACTIVE");
    const closed = elections.find((e) => e.status === "CLOSED");
    return active?.id ?? closed?.id ?? elections[0]?.id;
  }, [elections]);

  // Use selected ID if user engaged, otherwise fallback to default
  const currentElectionId = selectedElectionId ?? defaultElectionId;

  const {
    results,
    loading: resultsLoading,
    error: resultsError,
    refresh: refreshResults
  } = useResults(currentElectionId);

  const selectedElection = useMemo(
    () => elections.find((e) => e.id === currentElectionId) ?? null,
    [elections, currentElectionId]
  );

  function handleElectionChange(id: string) {
    setSelectedElectionId(id || null);
  }

  function handleRefresh() {
    refreshElections();
    refreshResults();
  }

  if (electionsLoading && !selectedElection) {
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
              onClick={handleRefresh}
              disabled={!currentElectionId}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {(electionsError || resultsError) && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="text-sm">Terjadi kesalahan</AlertTitle>
          <AlertDescription className="text-xs">{electionsError || resultsError}</AlertDescription>
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
                value={currentElectionId ?? ""}
                onValueChange={handleElectionChange}
                disabled={elections.length === 0}
              >
                <SelectTrigger className="h-9 w-full min-w-0 text-xs *:data-[slot='select-value']:truncate">
                  <SelectValue placeholder="Tidak ada pemilihan" />
                </SelectTrigger>
                <SelectContent>
                  {elections.length === 0 && (
                    <SelectItem value="__no_elections__" disabled>
                      Tidak ada pemilihan
                    </SelectItem>
                  )}
                  {elections.map((e) => (
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

          {results ? (
            <StatsBadges tokenStats={results.tokenStats} totalVotes={results.totalVotes} />
          ) : null}
        </CardHeader>

        <CardContent>
          {!currentElectionId ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm">
              Buat/pilih pemilihan terlebih dahulu untuk melihat hasil.
            </div>
          ) : resultsLoading ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : results ? (
            <ResultsChart results={results} />
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
              {/* Empty state handled in subcomponent or not needed if results guaranteed */}
            </div>
          )}
        </CardContent>

        {results ? (
          <CardFooter className="border-border/60 text-muted-foreground border-t pt-4 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span>Pemilihan:</span>
              <span className="font-medium">{results.election.slug}</span>
              <span className="mx-1">-</span>
              <span>Status:</span>
              <span className="font-medium">{results.election.status}</span>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
