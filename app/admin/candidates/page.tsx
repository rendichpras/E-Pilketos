"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { apiClient } from "@/lib/api-client";
import type { CandidatePair, Election } from "@/lib/types";
import { cn } from "@/lib/cn";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
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
  Users2,
  Plus,
  RefreshCw,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Save,
  CircleSlash2,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

type CandidateForm = {
  number: string;
  shortName: string;
  ketuaName: string;
  ketuaClass: string;
  wakilName: string;
  wakilClass: string;
  photoUrl: string;
  vision: string;
  mission: string;
  programs: string;
  isActive: boolean;
};

type AdminCandidatesResponse = {
  election: Election;
  candidates: CandidatePair[];
};

type StatusTab = "all" | "active" | "inactive";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function statusBadge(isActive: boolean) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    isActive
      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700"
      : "border-border bg-muted text-muted-foreground"
  );
}

export default function AdminCandidatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidatePair[]>([]);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<CandidatePair | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState<CandidateForm>({
    number: "",
    shortName: "",
    ketuaName: "",
    ketuaClass: "",
    wakilName: "",
    wakilClass: "",
    photoUrl: "",
    vision: "",
    mission: "",
    programs: "",
    isActive: true
  });

  const selectedElection = useMemo(
    () => elections.find((e) => e.id === selectedElectionId) ?? null,
    [elections, selectedElectionId]
  );

  const canEdit = Boolean(selectedElection && selectedElection.status === "DRAFT");

  const counts = useMemo(() => {
    const total = candidates.length;
    const active = candidates.filter((c) => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = normalize(query);

    return candidates
      .filter((c) => (tab === "all" ? true : tab === "active" ? c.isActive : !c.isActive))
      .filter((c) => {
        if (!q) return true;
        const hay =
          `${c.number} ${c.shortName} ${c.ketuaName} ${c.wakilName} ${c.ketuaClass} ${c.wakilClass}`
            .toLowerCase()
            .trim();
        return hay.includes(q);
      })
      .sort((a, b) => a.number - b.number);
  }, [candidates, query, tab]);

  function resetForm() {
    setForm({
      number: "",
      shortName: "",
      ketuaName: "",
      ketuaClass: "",
      wakilName: "",
      wakilClass: "",
      photoUrl: "",
      vision: "",
      mission: "",
      programs: "",
      isActive: true
    });
    setEditingId(null);
    setError(null);
  }

  async function loadCandidates(electionId: string) {
    try {
      const data = await apiClient.get<AdminCandidatesResponse>(
        `/admin/candidates/election/${electionId}`
      );
      setCandidates(data.candidates);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal memuat kandidat.";
      setError(message);
      toast.error(message);
    }
  }

  async function loadElections() {
    setError(null);
    try {
      const data = await apiClient.get<Election[]>("/admin/elections");

      const active = data.find((e) => e.status === "ACTIVE");
      const selectedId = active?.id ?? data[0]?.id ?? null;

      setElections(data);
      setSelectedElectionId(selectedId);

      if (selectedId) {
        await loadCandidates(selectedId);
      } else {
        setCandidates([]);
      }
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal memuat daftar pemilihan.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleElectionChange(value: string) {
    const id = value || null;
    setSelectedElectionId(id);
    setCandidates([]);
    setQuery("");
    setTab("all");
    resetForm();
    setSheetOpen(false);

    if (id) {
      await loadCandidates(id);
    }
  }

  function guardDraftOnly() {
    if (!selectedElectionId) {
      const msg = "Pilih pemilihan terlebih dahulu.";
      setError(msg);
      toast.error(msg);
      return false;
    }
    if (!canEdit) {
      const msg = "Kandidat hanya bisa diubah saat status pemilihan masih DRAFT.";
      setError(msg);
      toast.error(msg);
      return false;
    }
    return true;
  }

  function openCreate() {
    if (!guardDraftOnly()) return;
    resetForm();
    setSheetOpen(true);
  }

  function openEdit(candidate: CandidatePair) {
    if (!guardDraftOnly()) return;

    setEditingId(candidate.id);
    setForm({
      number: String(candidate.number),
      shortName: candidate.shortName,
      ketuaName: candidate.ketuaName,
      ketuaClass: candidate.ketuaClass,
      wakilName: candidate.wakilName,
      wakilClass: candidate.wakilClass,
      photoUrl: candidate.photoUrl ?? "",
      vision: candidate.vision ?? "",
      mission: candidate.mission ?? "",
      programs: candidate.programs ?? "",
      isActive: candidate.isActive
    });
    setError(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSubmitting(false);
    setEditingId(null);
    resetForm();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!guardDraftOnly()) return;

    const number = Number.parseInt(form.number, 10);
    if (Number.isNaN(number) || number <= 0) {
      const msg = "Nomor urut wajib berupa angka positif.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (
      !form.shortName.trim() ||
      !form.ketuaName.trim() ||
      !form.ketuaClass.trim() ||
      !form.wakilName.trim() ||
      !form.wakilClass.trim()
    ) {
      const msg = "Nama singkat, ketua, kelas ketua, wakil, dan kelas wakil wajib diisi.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      number,
      shortName: form.shortName.trim(),
      ketuaName: form.ketuaName.trim(),
      ketuaClass: form.ketuaClass.trim(),
      wakilName: form.wakilName.trim(),
      wakilClass: form.wakilClass.trim(),
      photoUrl: form.photoUrl.trim() || undefined,
      vision: form.vision.trim() || undefined,
      mission: form.mission.trim() || undefined,
      programs: form.programs.trim() || undefined,
      isActive: form.isActive
    };

    try {
      if (editingId) {
        const updated = await apiClient.put<CandidatePair>(
          `/admin/candidates/${editingId}`,
          payload
        );
        setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Kandidat berhasil diperbarui.");
      } else {
        await apiClient.post<CandidatePair>(
          `/admin/candidates/election/${selectedElectionId}`,
          payload
        );
        await loadCandidates(selectedElectionId!);
        toast.success("Kandidat berhasil ditambahkan.");
      }

      closeSheet();
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal menyimpan kandidat. Periksa kembali data.";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    if (!guardDraftOnly()) return;

    setDeletingId(confirmDelete.id);
    setError(null);

    try {
      await apiClient.delete<{ success: boolean }>(`/admin/candidates/${confirmDelete.id}`);
      await loadCandidates(selectedElectionId!);
      toast.success("Kandidat berhasil dihapus.");
      setConfirmDelete(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal menghapus kandidat.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(candidate: CandidatePair, next: boolean) {
    if (!guardDraftOnly()) return;

    setTogglingId(candidate.id);
    setError(null);

    try {
      const updated = await apiClient.put<CandidatePair>(`/admin/candidates/${candidate.id}`, {
        isActive: next
      });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(next ? "Kandidat diaktifkan." : "Kandidat dinonaktifkan.");
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal mengubah status kandidat.";
      setError(message);
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-2/3 max-w-xl" />
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="border-border/60 border-b pb-3">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
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
              <Users2 className="h-6 w-6" />
              Kandidat
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Kelola pasangan calon per pemilihan. Perubahan kandidat hanya diizinkan saat status
              pemilihan DRAFT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={() => loadElections()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-[11px]"
              onClick={openCreate}
              disabled={!selectedElectionId || !canEdit}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah paslon
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="text-sm">Terjadi kesalahan</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {selectedElection && !canEdit && (
        <Alert className="border-border/70 bg-muted/30">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4" />
            Kandidat terkunci
          </AlertTitle>
          <AlertDescription className="text-xs">
            Status pemilihan saat ini <b>{selectedElection.status}</b>. Kandidat hanya bisa
            tambah/ubah/hapus saat <b>DRAFT</b>.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Pemilihan</CardTitle>
              <CardDescription className="text-xs">
                Pilih periode pemilihan untuk melihat dan mengelola kandidat.
              </CardDescription>
            </div>

            <div className="w-full md:max-w-md">
              <Select
                value={selectedElectionId ?? ""}
                onValueChange={handleElectionChange}
                disabled={elections.length === 0}
              >
                <SelectTrigger className="h-9 w-full min-w-0 text-xs [&_[data-slot='select-value']]:truncate">
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
                      <div className="block max-w-full truncate">
                        {e.name} ({e.status})
                      </div>
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
        </CardHeader>

        <CardContent>
          {!selectedElectionId ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm">
              Buat/pilih pemilihan terlebih dahulu untuk mengelola kandidat.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
                  <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="all" className="gap-2">
                      Semua{" "}
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {counts.total}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="active" className="gap-2">
                      Aktif{" "}
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {counts.active}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="gap-2">
                      Nonaktif{" "}
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {counts.inactive}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative w-full md:w-80">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nomor, nama paslon, ketua, wakil..."
                    className="pl-9"
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
                  <Users2 className="text-muted-foreground h-8 w-8" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tidak ada kandidat</p>
                    <p className="text-muted-foreground text-xs">
                      Ubah filter/pencarian atau tambahkan pasangan calon baru.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 h-8 rounded-full px-4 text-[11px]"
                    onClick={openCreate}
                    disabled={!canEdit}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah paslon
                  </Button>
                </div>
              ) : (
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
                      {filtered.map((c) => (
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
                                <Badge variant="outline" className={statusBadge(c.isActive)}>
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
                                onCheckedChange={(next) => toggleActive(c, next)}
                                disabled={
                                  !canEdit ||
                                  togglingId === c.id ||
                                  submitting ||
                                  deletingId === c.id
                                }
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
                                <DropdownMenuItem onClick={() => openEdit(c)} disabled={!canEdit}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setConfirmDelete(c)}
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
              )}
            </div>
          )}
        </CardContent>

        {selectedElectionId ? (
          <CardFooter className="border-border/60 text-muted-foreground border-t pt-4 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span>Menampilkan</span>
              <span className="font-medium">{filtered.length}</span>
              <span>kandidat</span>
              <span className="mx-1">•</span>
              <span>Total</span>
              <span className="font-medium">{counts.total}</span>
            </div>
          </CardFooter>
        ) : null}
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : closeSheet())}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          <div className="border-border/60 border-b px-6 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Ubah paslon" : "Tambah paslon"}
              </SheetTitle>
              <SheetDescription>
                Isi data pasangan calon. Nomor urut wajib unik di pemilihan yang sama.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 px-6 py-5">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="number">Nomor urut</Label>
                    <Input
                      id="number"
                      value={form.number}
                      onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                      inputMode="numeric"
                      placeholder="1, 2, 3, ..."
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortName">Nama singkat paslon</Label>
                    <Input
                      id="shortName"
                      value={form.shortName}
                      onChange={(e) => setForm((p) => ({ ...p, shortName: e.target.value }))}
                      placeholder="misal: Harmoni Aksi"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ketuaName">Nama ketua</Label>
                    <Input
                      id="ketuaName"
                      value={form.ketuaName}
                      onChange={(e) => setForm((p) => ({ ...p, ketuaName: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ketuaClass">Kelas ketua</Label>
                    <Input
                      id="ketuaClass"
                      value={form.ketuaClass}
                      onChange={(e) => setForm((p) => ({ ...p, ketuaClass: e.target.value }))}
                      placeholder="XI IPA 1"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wakilName">Nama wakil</Label>
                    <Input
                      id="wakilName"
                      value={form.wakilName}
                      onChange={(e) => setForm((p) => ({ ...p, wakilName: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wakilClass">Kelas wakil</Label>
                    <Input
                      id="wakilClass"
                      value={form.wakilClass}
                      onChange={(e) => setForm((p) => ({ ...p, wakilClass: e.target.value }))}
                      placeholder="XI IPS 2"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">URL foto pasangan (opsional)</Label>
                  <Input
                    id="photoUrl"
                    value={form.photoUrl}
                    onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
                    placeholder="https://..."
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision">Visi</Label>
                  <Textarea
                    id="vision"
                    value={form.vision}
                    onChange={(e) => setForm((p) => ({ ...p, vision: e.target.value }))}
                    className="min-h-[80px]"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission">Misi</Label>
                  <Textarea
                    id="mission"
                    value={form.mission}
                    onChange={(e) => setForm((p) => ({ ...p, mission: e.target.value }))}
                    className="min-h-[80px]"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programs">Program kerja utama</Label>
                  <Textarea
                    id="programs"
                    value={form.programs}
                    onChange={(e) => setForm((p) => ({ ...p, programs: e.target.value }))}
                    className="min-h-[80px]"
                    disabled={submitting}
                  />
                </div>

                <div className="border-border/60 bg-muted/30 rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Paslon aktif</p>
                      <p className="text-muted-foreground text-[11px]">
                        Jika nonaktif, paslon tidak tampil di halaman pemilihan.
                      </p>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                    <AlertTitle className="text-sm">Tidak bisa menyimpan</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>

            <div className="border-border/60 bg-background/95 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
              <SheetFooter className="flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeSheet} disabled={submitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan
                    </>
                  )}
                </Button>
              </SheetFooter>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pasangan calon?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data paslon akan dihapus dari pemilihan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmDelete ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-medium">
                Paslon {confirmDelete.number} • {confirmDelete.shortName}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Ketua: {confirmDelete.ketuaName} • Wakil: {confirmDelete.wakilName}
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId === confirmDelete?.id}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={!confirmDelete || deletingId === confirmDelete.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === confirmDelete?.id ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
