import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import type { AdminResultsResponse } from "@/shared/types";
import { Trophy } from "lucide-react";

function fmtId(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

interface ResultsChartProps {
  results: AdminResultsResponse;
}

export function ResultsChart({ results }: ResultsChartProps) {
  const totalVotes = results.totalVotes ?? 0;

  const candidateRows = useMemo(() => {
    const rows = results.results ?? [];
    return rows
      .map((r) => ({
        candidateId: r.candidate.id,
        number: r.candidate.number,
        shortName: r.candidate.shortName,
        ketuaName: r.candidate.ketuaName,
        wakilName: r.candidate.wakilName,
        totalVotes: r.voteCount
      }))
      .slice()
      .sort((a, b) => b.totalVotes - a.totalVotes);
  }, [results]);

  if (candidateRows.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
        <Trophy className="text-muted-foreground h-8 w-8" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Belum ada kandidat</p>
          <p className="text-muted-foreground text-xs">
            Kandidat belum terdaftar untuk pemilihan ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="text-muted-foreground mb-2 text-[11px]">
          update: {fmtId(results.election.updatedAt)}
        </div>

        <div className="space-y-2">
          {candidateRows.map((c, idx) => {
            const pct = totalVotes > 0 ? Math.round((c.totalVotes / totalVotes) * 1000) / 10 : 0;

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
                      Ketua: <span className="text-foreground font-medium">{c.ketuaName}</span>
                    </div>
                    <div className="text-muted-foreground text-[11px] leading-snug">
                      Wakil: <span className="text-foreground font-medium">{c.wakilName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base leading-none font-semibold">{c.totalVotes}</div>
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

      {/* Desktop View */}
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
            {candidateRows.map((c, idx) => {
              const pct = totalVotes > 0 ? Math.round((c.totalVotes / totalVotes) * 1000) / 10 : 0;

              return (
                <TableRow key={c.candidateId} className={cn(idx === 0 && "bg-emerald-500/5")}>
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
                        Ketua: <span className="text-foreground font-medium">{c.ketuaName}</span> -
                        Wakil: <span className="text-foreground font-medium">{c.wakilName}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right align-top">
                    <div className="text-sm font-semibold">{c.totalVotes}</div>
                    <div className="text-muted-foreground text-[11px]">
                      update: {fmtId(results.election.updatedAt)}
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
  );
}
