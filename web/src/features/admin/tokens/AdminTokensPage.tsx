"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
  KeyRound,
  Plus,
  RefreshCw,
  DownloadCloud,
  XCircle,
  Printer,
  ShieldAlert,
  Search
} from "lucide-react";
import { toast } from "sonner";

import { useAdmin } from "@/features/admin/session/admin-context";
import { useElections } from "@/features/admin/elections/hooks/useElections";
import { useTokens } from "./hooks/useTokens";
import { TokensTable, statusBadgeClass } from "./components/TokensTable";
import { GenerateTokensDialog } from "./components/GenerateTokensDialog";

import type { Token, TokenStatus, GenerateTokensDto } from "@/shared/types";
import { cn } from "@/lib/cn";

type StatusTab = "all" | TokenStatus;

export default function AdminTokensPage() {
  const admin = useAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const {
    elections,
    loading: electionsLoading,
    refresh: refreshElections,
    error: electionsError
  } = useElections();

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedElectionId && elections.length > 0) {
      const active = elections.find((e) => e.status === "ACTIVE");
      const def = active?.id ?? elections[0]?.id;
      if (def) setSelectedElectionId(def);
    }
  }, [elections, selectedElectionId]);

  const {
    data,
    loading: tokensLoading,
    error: tokensError,
    fetchTokens,
    generateTokens,
    invalidateToken
  } = useTokens(selectedElectionId);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [confirmInvalidate, setConfirmInvalidate] = useState<Token | null>(null);
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null);

  const selectedElection = useMemo(
    () => elections.find((e) => e.id === selectedElectionId) ?? null,
    [elections, selectedElectionId]
  );

  const canManageTokens = Boolean(isSuperAdmin && selectedElection?.status === "DRAFT");

  const tokens = useMemo(() => data?.tokens ?? [], [data]);
  const pagination = data?.pagination ?? null;
  const total = pagination?.total ?? 0;

  useEffect(() => {
    if (selectedElectionId) {
      fetchTokens({
        page: pageNumber,
        limit: pageSize,
        status: tab,
        q: query
      });
    }
  }, [selectedElectionId, pageNumber, pageSize, tab, query, fetchTokens]);

  const countsOnPage = useMemo(() => {
    const used = tokens.filter((t) => t.status === "USED").length;
    const unused = tokens.filter((t) => t.status === "UNUSED").length;
    const invalid = tokens.filter((t) => t.status === "INVALIDATED").length;
    return { used, unused, invalid };
  }, [tokens]);

  function handleElectionChange(id: string) {
    setSelectedElectionId(id || null);
    setPageNumber(1);
    setQuery("");
    setTab("all");
  }

  async function handleRefresh() {
    refreshElections();
    if (selectedElectionId) {
      fetchTokens({
        page: pageNumber,
        limit: pageSize,
        status: tab,
        q: query
      });
    }
  }

  async function handleGenerateSubmit(dto: GenerateTokensDto) {
    if (!selectedElectionId) return;
    setIsGenerating(true);
    try {
      await generateTokens(dto);
      setPageNumber(1);
      fetchTokens({ page: 1, limit: pageSize, status: tab, q: query });
      setGenerateOpen(false);
    } catch {
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleInvalidateConfirmed() {
    if (!confirmInvalidate) return;
    setInvalidatingId(confirmInvalidate.id);
    try {
      await invalidateToken(confirmInvalidate.id);
      fetchTokens({ page: pageNumber, limit: pageSize, status: tab, q: query });
      setConfirmInvalidate(null);
    } catch {
    } finally {
      setInvalidatingId(null);
    }
  }

  function exportCsv() {
    if (!tokens.length) return;
    const rows = tokens.filter((t) => t.status === "UNUSED");
    if (rows.length === 0) {
      toast.error("Tidak ada token UNUSED pada filter saat ini.");
      return;
    }

    const header = ["token", "status", "batch"];
    const lines = [
      header.join(","),
      ...rows.map((t) => [`"${t.token}"`, t.status, t.generatedBatch ?? ""].join(","))
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tokens-unused.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handlePrintPdf = () => {
    if (!selectedElectionId) return;
    const qs = new URLSearchParams();
    qs.set("electionId", selectedElectionId);
    qs.set("status", "UNUSED");
    qs.set("max", "5000");
    const url = `/admin/tokens/print-pdf?${qs.toString()}`;
    window.open(url, "_blank");
  };

  if (electionsLoading && !selectedElection) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="border-border/60 border-b pb-3">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-56 rounded-xl" />
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
          konfigurasi
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <KeyRound className="h-6 w-6" />
              Token
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Generate token pemilih dan kelola status token (belum digunakan, digunakan,
              dibatalkan).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleRefresh}
              disabled={!selectedElectionId}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-[11px]"
              onClick={() => setGenerateOpen(true)}
              disabled={!selectedElectionId || !canManageTokens}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate token
            </Button>
          </div>
        </div>
      </header>

      {(electionsError || tokensError) && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4" />
            Terjadi kesalahan
          </AlertTitle>
          <AlertDescription className="text-xs">{electionsError || tokensError}</AlertDescription>
        </Alert>
      )}

      {selectedElection && selectedElection.status !== "DRAFT" && (
        <Alert className="border-border/70 bg-muted/30">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4" />
            Token terkunci
          </AlertTitle>
          <AlertDescription className="text-xs">
            Generate dan invalidasi token hanya bisa saat status pemilihan <b>DRAFT</b>.
          </AlertDescription>
        </Alert>
      )}

      {selectedElection && !isSuperAdmin && (
        <Alert className="border-border/70 bg-muted/30">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4" />
            Akses dibatasi
          </AlertTitle>
          <AlertDescription className="text-xs">
            Generate dan invalidasi token hanya untuk role <b>SUPER_ADMIN</b>.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Pemilihan</CardTitle>
              <CardDescription className="text-xs">
                Pilih pemilihan untuk melihat token. Token digunakan siswa untuk masuk ke halaman
                voting.
              </CardDescription>
            </div>

            <div className="w-full md:max-w-md">
              <Select
                value={selectedElectionId ?? ""}
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

          {selectedElectionId ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                  Total: {total}
                </Badge>
                <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                  Halaman ini: {tokens.length}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-full text-[11px] font-medium", statusBadgeClass("USED"))}
                >
                  Used: {countsOnPage.used}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-full text-[11px] font-medium", statusBadgeClass("UNUSED"))}
                >
                  Unused: {countsOnPage.unused}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px] font-medium",
                    statusBadgeClass("INVALIDATED")
                  )}
                >
                  Invalid: {countsOnPage.invalid}
                </Badge>
              </div>

              <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full rounded-full px-3 text-[11px] sm:w-auto"
                  onClick={exportCsv}
                  disabled={tokens.filter((t) => t.status === "UNUSED").length === 0}
                >
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export CSV (UNUSED)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full rounded-full px-3 text-[11px] sm:w-auto"
                  onClick={handlePrintPdf}
                  disabled={!selectedElectionId}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  PDF token (UNUSED)
                </Button>
              </div>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {!selectedElectionId ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm">
              Buat/pilih pemilihan terlebih dahulu untuk mengelola token.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
                  <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="UNUSED">UNUSED</TabsTrigger>
                    <TabsTrigger value="USED">USED</TabsTrigger>
                    <TabsTrigger value="INVALIDATED">INVALID</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative w-full md:w-80">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari token / batch..."
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">Per halaman</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      const next = Number.parseInt(v, 10);
                      if (!Number.isNaN(next)) {
                        setPageSize(next);
                        setPageNumber(1);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[25, 50, 100, 200].map((v) => (
                        <SelectItem key={v} value={String(v)} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tokensLoading ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : tokens.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
                  <KeyRound className="text-muted-foreground h-8 w-8" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Belum ada token</p>
                    <p className="text-muted-foreground text-xs">
                      Generate token untuk pemilihan ini agar bisa dibagikan ke siswa.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 h-8 rounded-full px-4 text-[11px]"
                    onClick={() => setGenerateOpen(true)}
                    disabled={!canManageTokens}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate token
                  </Button>
                </div>
              ) : (
                <TokensTable
                  tokens={tokens}
                  canManageTokens={canManageTokens}
                  onInvalidate={setConfirmInvalidate}
                  invalidatingId={invalidatingId}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <GenerateTokensDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSubmit={handleGenerateSubmit}
        isGenerating={isGenerating}
      />

      <AlertDialog
        open={!!confirmInvalidate}
        onOpenChange={(o) => !o && setConfirmInvalidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalidasi Token</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan membatalkan token <b>{confirmInvalidate?.token}</b>.<br />
              Token ini tidak akan bisa digunakan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!invalidatingId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInvalidateConfirmed}
              disabled={!!invalidatingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {invalidatingId ? "Memproses..." : "Invalidasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
