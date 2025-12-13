"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { apiClient } from "@/lib/api-client";
import type { AdminTokensListResponse, Election, Token, TokenStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

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
  Copy,
  MoreHorizontal,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Ban,
  Search,
  Printer
} from "lucide-react";

type PageState = {
  loading: boolean;
  error: string | null;
  elections: Election[];
  selectedElectionId: string | null;
  tokensRes: AdminTokensListResponse | null;
  generating: boolean;
  invalidatingId: string | null;
};

type GenerateForm = {
  count: string;
  batchLabel: string;
};

type StatusTab = "all" | TokenStatus;

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function fmtId(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadgeClass(status: TokenStatus) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    status === "UNUSED" && "border-border bg-muted text-foreground/80",
    status === "USED" && "border-emerald-500/60 bg-emerald-500/10 text-emerald-700",
    status === "INVALIDATED" && "border-destructive/60 bg-destructive/10 text-destructive"
  );
}

export default function AdminTokensPage() {
  const [page, setPage] = useState<PageState>({
    loading: true,
    error: null,
    elections: [],
    selectedElectionId: null,
    tokensRes: null,
    generating: false,
    invalidatingId: null
  });

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<TokenStatus>("UNUSED");
  const [pdfBatch, setPdfBatch] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [form, setForm] = useState<GenerateForm>({ count: "", batchLabel: "" });

  const [confirmInvalidate, setConfirmInvalidate] = useState<Token | null>(null);

  const selectedElection = useMemo(
    () => page.elections.find((e) => e.id === page.selectedElectionId) ?? null,
    [page.elections, page.selectedElectionId]
  );

  const tokens = page.tokensRes?.tokens ?? [];
  const pagination = page.tokensRes?.pagination ?? null;

  const total = pagination?.total ?? 0;
  const limit = pagination?.limit ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const pdfUrl = useMemo(() => {
    if (!page.selectedElectionId) return "#";
    const qs = new URLSearchParams();
    qs.set("electionId", page.selectedElectionId);
    qs.set("status", pdfStatus);
    if (pdfBatch.trim()) qs.set("batch", pdfBatch.trim());
    qs.set("max", "5000");
    return `/admin/tokens/print-pdf?${qs.toString()}`;
  }, [page.selectedElectionId, pdfStatus, pdfBatch]);

  const visibleTokens = useMemo(() => {
    const q = normalize(query);

    return tokens.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (!q) return true;

      const hay = `${t.token} ${t.status} ${t.generatedBatch ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tokens, tab, query]);

  const countsOnPage = useMemo(() => {
    const used = tokens.filter((t) => t.status === "USED").length;
    const unused = tokens.filter((t) => t.status === "UNUSED").length;
    const invalid = tokens.filter((t) => t.status === "INVALIDATED").length;
    return { used, unused, invalid };
  }, [tokens]);

  useEffect(() => {
    let cancelled = false;

    async function loadElections() {
      try {
        const data = await apiClient.get<Election[]>("/admin/elections");
        if (cancelled) return;

        const active = data.find((e) => e.status === "ACTIVE");
        const selectedId = active?.id ?? data[0]?.id ?? null;

        setPage((prev) => ({
          ...prev,
          elections: data,
          selectedElectionId: selectedId,
          loading: false
        }));

        if (selectedId) {
          await loadTokens(selectedId, 1, pageSize);
        }
      } catch (err: any) {
        if (cancelled) return;
        const message = err?.data?.error ?? "Gagal memuat daftar pemilihan.";
        setPage((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
      }
    }

    loadElections();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTokens(electionId: string, pageParam: number, limitParam: number = pageSize) {
    try {
      const res = await apiClient.get<AdminTokensListResponse>(
        `/admin/tokens/${electionId}?page=${pageParam}&limit=${limitParam}`
      );
      setPage((prev) => ({ ...prev, tokensRes: res }));
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal memuat token.";
      setPage((prev) => ({ ...prev, error: message }));
      toast.error(message);
    }
  }

  async function refresh() {
    if (!page.selectedElectionId) return;
    await loadTokens(page.selectedElectionId, pageNumber, pageSize);
  }

  async function handleElectionChange(id: string) {
    setPageNumber(1);
    setQuery("");
    setTab("all");

    setPage((prev) => ({
      ...prev,
      selectedElectionId: id || null,
      tokensRes: null,
      error: null
    }));

    if (id) {
      await loadTokens(id, 1, pageSize);
    }
  }

  async function changePage(newPage: number) {
    if (!page.selectedElectionId || newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    await loadTokens(page.selectedElectionId, newPage, pageSize);
  }

  function exportCsv() {
    if (!page.tokensRes) return;
    const rows = visibleTokens;
    if (rows.length === 0) return;

    const header = ["token", "status", "batch"];
    const lines = [
      header.join(","),
      ...rows.map((t) => [`"${t.token}"`, t.status, t.generatedBatch ?? ""].join(","))
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tokens.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  async function copyToken(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Token disalin.");
    } catch {
      toast.error("Gagal menyalin token.");
    }
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();

    if (!page.selectedElectionId) {
      setPage((prev) => ({ ...prev, error: "Pilih pemilihan terlebih dahulu." }));
      toast.error("Pilih pemilihan terlebih dahulu.");
      return;
    }

    const count = Number.parseInt(form.count, 10);
    if (Number.isNaN(count) || count <= 0) {
      setPage((prev) => ({ ...prev, error: "Jumlah token harus angka positif." }));
      toast.error("Jumlah token harus angka positif.");
      return;
    }

    setPage((prev) => ({ ...prev, generating: true, error: null }));

    try {
      await apiClient.post(`/admin/tokens/generate/${page.selectedElectionId}`, {
        count,
        batchLabel: form.batchLabel.trim() || undefined
      });

      setForm({ count: "", batchLabel: "" });
      setGenerateOpen(false);

      await loadTokens(page.selectedElectionId, 1, pageSize);
      setPageNumber(1);

      toast.success("Token berhasil dibuat.");
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal generate token.";
      setPage((prev) => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setPage((prev) => ({ ...prev, generating: false }));
    }
  }

  async function doInvalidate(token: Token) {
    if (!page.selectedElectionId) return;

    setPage((prev) => ({ ...prev, invalidatingId: token.id, error: null }));

    try {
      await apiClient.post(`/admin/tokens/invalidate/${token.id}`, {});
      await loadTokens(page.selectedElectionId, pageNumber, pageSize);
      toast.success("Token berhasil diinvalidasi.");
      setConfirmInvalidate(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal mengubah status token.";
      setPage((prev) => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setPage((prev) => ({ ...prev, invalidatingId: null }));
    }
  }

  if (page.loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </header>

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
              onClick={refresh}
              disabled={!page.selectedElectionId}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-[11px]"
              onClick={() => setGenerateOpen(true)}
              disabled={!page.selectedElectionId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate token
            </Button>
          </div>
        </div>
      </header>

      {page.error && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4" />
            Terjadi kesalahan
          </AlertTitle>
          <AlertDescription className="text-xs">{page.error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Pemilihan</CardTitle>
              <CardDescription className="text-xs">
                Pilih pemilihan untuk melihat token. Token digunakan siswa untuk masuk ke halaman
                pemilihan.
              </CardDescription>
            </div>

            <div className="w-full md:max-w-md">
              <Select
                value={page.selectedElectionId ?? ""}
                onValueChange={handleElectionChange}
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

          {page.selectedElectionId ? (
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
                  disabled={!page.tokensRes || visibleTokens.length === 0}
                >
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full rounded-full px-3 text-[11px] sm:w-auto"
                  onClick={() => setPdfOpen(true)}
                  disabled={!page.selectedElectionId}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  PDF token
                </Button>
              </div>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {!page.selectedElectionId ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm">
              Buat/pilih pemilihan terlebih dahulu untuk mengelola kandidat.
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
                    onValueChange={async (v) => {
                      const next = Number.parseInt(v, 10);
                      if (Number.isNaN(next)) return;

                      setPageSize(next);
                      setPageNumber(1);

                      if (page.selectedElectionId) {
                        await loadTokens(page.selectedElectionId, 1, next);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25" className="text-xs">
                        25
                      </SelectItem>
                      <SelectItem value="50" className="text-xs">
                        50
                      </SelectItem>
                      <SelectItem value="100" className="text-xs">
                        100
                      </SelectItem>
                      <SelectItem value="200" className="text-xs">
                        200
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tokens.length === 0 ? (
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
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate token
                  </Button>
                </div>
              ) : (
                <>
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
                        {visibleTokens.map((t) => (
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
                                    onClick={() => copyToken(t.token)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  Dibuat: {fmtId(t.createdAt)}
                                  {t.usedAt ? <> • Dipakai: {fmtId(t.usedAt)}</> : null}
                                  {t.invalidatedAt ? (
                                    <> • Invalid: {fmtId(t.invalidatedAt)}</>
                                  ) : null}
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

                                  <DropdownMenuItem onClick={() => copyToken(t.token)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Salin token
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => setConfirmInvalidate(t)}
                                    disabled={
                                      t.status === "USED" ||
                                      t.status === "INVALIDATED" ||
                                      page.invalidatingId === t.id
                                    }
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {page.invalidatingId === t.id ? "Memproses..." : "Invalidasi"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <CardFooter className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t pt-4 text-xs md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-1">
                        <span>Halaman</span>
                        <span className="font-medium">{pageNumber}</span>
                        <span>dari</span>
                        <span className="font-medium">{totalPages}</span>
                        <span className="mx-1">•</span>
                        <span>Menampilkan</span>
                        <span className="font-medium">{visibleTokens.length}</span>
                        <span>token</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          disabled={pageNumber <= 1}
                          onClick={() => changePage(pageNumber - 1)}
                        >
                          <ArrowLeft className="mr-1 h-3 w-3" />
                          Sebelumnya
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          disabled={pageNumber >= totalPages}
                          onClick={() => changePage(pageNumber + 1)}
                        >
                          Berikutnya
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={generateOpen} onOpenChange={setGenerateOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          <div className="border-border/60 border-b px-6 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generate token
              </SheetTitle>
              <SheetDescription>
                Buat token baru untuk pemilihan yang dipilih. Batch opsional untuk memudahkan
                filter/print.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleGenerate} className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 px-6 py-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="count">Jumlah token</Label>
                  <Input
                    id="count"
                    value={form.count}
                    onChange={(e) => setForm((p) => ({ ...p, count: e.target.value }))}
                    inputMode="numeric"
                    placeholder="misal: 300"
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Maksimal 10.000 per sekali generate.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchLabel">Batch (opsional)</Label>
                  <Input
                    id="batchLabel"
                    value={form.batchLabel}
                    onChange={(e) => setForm((p) => ({ ...p, batchLabel: e.target.value }))}
                    placeholder="misal: Kelas-XI / Gelombang-1"
                  />
                </div>

                <Separator />

                {page.error && (
                  <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                    <AlertTitle className="text-sm">Tidak bisa generate</AlertTitle>
                    <AlertDescription className="text-xs">{page.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>

            <div className="border-border/60 bg-background/95 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
              <SheetFooter className="flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGenerateOpen(false)}
                  disabled={page.generating}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={page.generating}>
                  {page.generating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </SheetFooter>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(confirmInvalidate)}
        onOpenChange={(open) => !open && setConfirmInvalidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalidasi token?</AlertDialogTitle>
            <AlertDialogDescription>
              Token yang diinvalidasi tidak bisa digunakan untuk voting. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmInvalidate ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-mono text-[12px] break-all">{confirmInvalidate.token}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Status saat ini: <span className="font-medium">{confirmInvalidate.status}</span>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={page.invalidatingId === confirmInvalidate?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmInvalidate && doInvalidate(confirmInvalidate)}
              disabled={!confirmInvalidate || page.invalidatingId === confirmInvalidate.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {page.invalidatingId === confirmInvalidate?.id ? "Memproses..." : "Invalidasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={pdfOpen} onOpenChange={setPdfOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          <div className="border-border/60 border-b px-6 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Unduh PDF token
              </SheetTitle>
              <SheetDescription>
                PDF akan dibuat dari server (bukan browser print). Gunakan filter status/batch bila
                perlu. Maksimal 5000 token per file.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 space-y-5 px-6 py-5">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Status token</Label>
              <Select value={pdfStatus} onValueChange={(v) => setPdfStatus(v as TokenStatus)}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNUSED" className="text-xs">
                    UNUSED
                  </SelectItem>
                  <SelectItem value="USED" className="text-xs">
                    USED
                  </SelectItem>
                  <SelectItem value="INVALIDATED" className="text-xs">
                    INVALIDATED
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-[11px]">
                Umumnya yang dicetak/dibagikan adalah <span className="font-semibold">UNUSED</span>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfBatch" className="text-xs sm:text-sm">
                Batch (opsional)
              </Label>
              <Input
                id="pdfBatch"
                value={pdfBatch}
                onChange={(e) => setPdfBatch(e.target.value)}
                placeholder="misal: Kelas X / Gelombang 1"
                className="h-9 text-xs sm:text-sm"
              />
              <p className="text-muted-foreground text-[11px]">
                Jika token banyak, pisahkan PDF per batch supaya tidak terlalu besar.
              </p>
            </div>

            <div className="border-border/60 bg-muted/20 text-muted-foreground rounded-xl border p-3 text-[11px]">
              Link PDF: <span className="font-mono break-all">{pdfUrl}</span>
            </div>
          </div>

          <div className="border-border/60 bg-background/95 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
            <SheetFooter className="flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPdfOpen(false)}>
                Batal
              </Button>

              <Button asChild disabled={!page.selectedElectionId}>
                <a href={pdfUrl} target="_blank" rel="noreferrer" onClick={() => setPdfOpen(false)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Unduh PDF
                </a>
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
