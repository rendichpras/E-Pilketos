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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Ban } from "lucide-react";
import type { Token, TokenStatus } from "@/shared/types";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

function fmtId(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function statusBadgeClass(status: TokenStatus) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    status === "UNUSED" && "border-border bg-muted text-foreground/80",
    status === "USED" && "border-emerald-500/60 bg-emerald-500/10 text-emerald-700",
    status === "INVALIDATED" && "border-destructive/60 bg-destructive/10 text-destructive"
  );
}

interface TokensTableProps {
  tokens: Token[];
  canManageTokens: boolean;
  onInvalidate: (token: Token) => void;
  invalidatingId?: string | null;
}

export function TokensTable({
  tokens,
  canManageTokens,
  onInvalidate,
  invalidatingId
}: TokensTableProps) {
  const copyToken = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Token disalin.");
    } catch {
      toast.error("Gagal menyalin token.");
    }
  };

  return (
    <div className="border-border/60 overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[60%] text-xs">Token</TableHead>
            <TableHead className="w-[15%] text-xs">Status</TableHead>
            <TableHead className="w-[20%] text-xs">Batch</TableHead>
            <TableHead className="w-[5%] text-right text-xs" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {tokens.map((t) => (
            <TableRow key={t.id} className="align-top">
              <TableCell className="max-w-0">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[11px]">{t.token}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={t.status !== "UNUSED"}
                      onClick={() => {
                        if (t.status !== "UNUSED") {
                          toast.error("Hanya token UNUSED yang boleh disalin.");
                          return;
                        }
                        copyToken(t.token);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-muted-foreground text-[10px]">
                    Dibuat: {fmtId(t.createdAt)}
                    {t.usedAt ? <> - Dipakai: {fmtId(t.usedAt)}</> : null}
                    {t.invalidatedAt ? <> - Invalid: {fmtId(t.invalidatedAt)}</> : null}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" className={statusBadgeClass(t.status)}>
                  {t.status}
                </Badge>
              </TableCell>

              <TableCell className="max-w-0">
                <span className="text-muted-foreground block max-w-[240px] truncate font-mono text-[11px]">
                  {t.generatedBatch ?? "-"}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs">Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      disabled={t.status !== "UNUSED"}
                      onClick={() => {
                        if (t.status !== "UNUSED") {
                          toast.error("Hanya token UNUSED yang boleh disalin.");
                          return;
                        }
                        copyToken(t.token);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Salin token
                    </DropdownMenuItem>

                    {canManageTokens && t.status === "UNUSED" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onInvalidate(t)}
                          disabled={invalidatingId === t.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {invalidatingId === t.id ? "Memproses..." : "Invalidasi"}
                        </DropdownMenuItem>
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
