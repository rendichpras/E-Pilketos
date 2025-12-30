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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Power, XCircle, Eye, EyeOff } from "lucide-react";
import type { Election } from "@/shared/types";
import { electionStatusBadge, resultPublicBadge } from "@/lib/badge-variants";

function formatDateTimeId(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

interface ElectionsTableProps {
  elections: Election[];
  onEdit: (election: Election) => void;
  onActivate: (election: Election) => void;
  onClose: (election: Election) => void;
  onPublish: (election: Election) => void;
  onHide: (election: Election) => void;
  isSuperAdmin: boolean;
  actionBusyId?: string | null;
}

export function ElectionsTable({
  elections,
  onEdit,
  onActivate,
  onClose,
  onPublish,
  onHide,
  isSuperAdmin,
  actionBusyId
}: ElectionsTableProps) {
  return (
    <div className="border-border/60 overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70%] text-xs">Nama</TableHead>
            <TableHead className="w-[18%] text-xs">Slug</TableHead>
            <TableHead className="w-[26%] text-xs">Waktu</TableHead>
            <TableHead className="w-[12%] text-center text-xs">Status</TableHead>
            <TableHead className="w-[10%] text-center text-xs">Hasil</TableHead>
            <TableHead className="w-[4%] text-right text-xs" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {elections.map((election) => (
            <TableRow key={election.id} className="align-top">
              <TableCell className="max-w-0">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-xs leading-snug font-medium">{election.name}</p>
                  <p className="text-muted-foreground line-clamp-1 text-[11px]">
                    {election.description || "Tidak ada deskripsi."}
                  </p>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="block max-w-[160px] truncate font-mono text-[11px]">
                  {election.slug}
                </span>
              </TableCell>

              <TableCell className="align-top">
                <div className="text-muted-foreground text-[11px]">
                  <div>{formatDateTimeId(election.startAt)}</div>
                  <div>{formatDateTimeId(election.endAt)}</div>
                </div>
              </TableCell>

              <TableCell className="text-center align-top">
                <Badge variant="outline" className={electionStatusBadge(election.status)}>
                  {election.status}
                </Badge>
              </TableCell>

              <TableCell className="text-center align-top">
                <Badge
                  variant="outline"
                  className={resultPublicBadge(Boolean(election.isResultPublic))}
                >
                  {election.isResultPublic ? "Publik" : "Privat"}
                </Badge>
              </TableCell>

              <TableCell className="text-right align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs">Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => onEdit(election)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Ubah
                    </DropdownMenuItem>

                    {isSuperAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>

                        {election.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => onActivate(election)}
                            disabled={actionBusyId === election.id}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Jadikan aktif
                          </DropdownMenuItem>
                        )}

                        {election.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => onClose(election)}
                            disabled={actionBusyId === election.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Tutup pemilihan
                          </DropdownMenuItem>
                        )}

                        {election.status === "CLOSED" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs">Hasil</DropdownMenuLabel>

                            {election.isResultPublic ? (
                              <DropdownMenuItem
                                onClick={() => onHide(election)}
                                disabled={actionBusyId === election.id}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Sembunyikan hasil
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onPublish(election)}
                                disabled={actionBusyId === election.id}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Publikasikan hasil
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </>
                    )}
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
