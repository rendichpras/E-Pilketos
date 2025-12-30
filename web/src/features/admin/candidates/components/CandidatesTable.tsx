import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, CircleSlash2 } from "lucide-react";
import type { CandidatePair } from "@/shared/types";
import { cn } from "@/lib/cn";

function statusBadgeClass(isActive: boolean) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    isActive
      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700"
      : "border-border bg-muted text-muted-foreground"
  );
}

interface CandidatesTableProps {
  candidates: CandidatePair[];
  canEdit: boolean;
  onEdit: (candidate: CandidatePair) => void;
  onDelete: (candidate: CandidatePair) => void;
  onToggleActive: (candidate: CandidatePair, next: boolean) => void;
  togglingId?: string | null;
  deletingId?: string | null;
}

export function CandidatesTable({
  candidates,
  canEdit,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
  deletingId
}: CandidatesTableProps) {
  return (
    <div className="border-border/60 overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[70px] text-xs">No</TableHead>
            <TableHead className="text-xs">Paslon</TableHead>
            <TableHead className="w-[120px] text-center text-xs">Aktif</TableHead>
            <TableHead className="w-[70px] text-right text-xs" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.id} className="align-top">
              <TableCell className="align-top">
                <Badge
                  variant="outline"
                  className="rounded-full font-mono text-[11px] tracking-[0.12em]"
                >
                  {c.number}
                </Badge>
              </TableCell>

              <TableCell className="max-w-0 align-top">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-semibold">{c.shortName}</p>
                    <Badge variant="outline" className={statusBadgeClass(c.isActive)}>
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <CircleSlash2 className="h-3 w-3" />
                          Nonaktif
                        </span>
                      )}
                    </Badge>
                  </div>

                  <div className="text-muted-foreground text-[11px]">
                    <span className="text-foreground font-medium">Ketua:</span>{" "}
                    <span className="inline-block max-w-[70%] truncate align-bottom">
                      {c.ketuaName}
                    </span>{" "}
                    <span className="text-muted-foreground">({c.ketuaClass})</span>
                  </div>

                  <div className="text-muted-foreground text-[11px]">
                    <span className="text-foreground font-medium">Wakil:</span>{" "}
                    <span className="inline-block max-w-[70%] truncate align-bottom">
                      {c.wakilName}
                    </span>{" "}
                    <span className="text-muted-foreground">({c.wakilClass})</span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <div className="flex items-center justify-center gap-2">
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={(next) => onToggleActive(c, next)}
                    disabled={!canEdit || togglingId === c.id || deletingId === c.id}
                  />
                </div>
              </TableCell>

              <TableCell className="text-right align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs">Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(c)} disabled={!canEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Ubah
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(c)}
                      disabled={!canEdit}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
