import type { Election } from "@/lib/types";
import type { ElectionDisplayStatus } from "./election-utils";
import { fmtJakarta } from "@/lib/format";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, Info } from "lucide-react";

type StatusCardProps = {
  election: Election | null;
  status: ElectionDisplayStatus;
  label: string;
  description: string;
  now: Date;
};

export function StatusCard({ election, status, label, description, now }: StatusCardProps) {
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
