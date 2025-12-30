"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
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
import { Users2, Plus, RefreshCw, Search, Pencil, ShieldAlert } from "lucide-react";

import { useElections } from "@/features/admin/elections/hooks/useElections";
import { useCandidates } from "./hooks/useCandidates";
import { CandidateForm, type CandidateFormData } from "./components/CandidateForm";
import { CandidatesTable } from "./components/CandidatesTable";

import type { CandidatePair } from "@/shared/types";
import { normalize } from "@/lib/search";
import { toast } from "sonner";

type StatusTab = "all" | "active" | "inactive";

export default function AdminCandidatesPage() {
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
    candidates,
    loading: candidatesLoading,
    error: candidatesError,
    refresh: refreshCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    toggleActive
  } = useCandidates(selectedElectionId);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidatePair | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<CandidatePair | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function handleElectionChange(value: string) {
    setSelectedElectionId(value || null);
    setQuery("");
    setTab("all");
    setEditingCandidate(null);
  }

  function guardDraftOnly() {
    if (!selectedElectionId) {
      toast.error("Pilih pemilihan terlebih dahulu.");
      return false;
    }
    if (!canEdit) {
      toast.error("Kandidat hanya bisa diubah saat status pemilihan masih DRAFT.");
      return false;
    }
    return true;
  }

  function openCreate() {
    if (!guardDraftOnly()) return;
    setEditingCandidate(null);
    setSheetOpen(true);
  }

  function openEdit(candidate: CandidatePair) {
    if (!guardDraftOnly()) return;
    setEditingCandidate(candidate);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingCandidate(null);
    setFormSubmitting(false);
  }

  async function handleFormSubmit(data: CandidateFormData) {
    if (!guardDraftOnly()) return;
    setFormSubmitting(true);
    try {
      const payload = {
        number: Number.parseInt(data.number, 10),
        shortName: data.shortName.trim(),
        ketuaName: data.ketuaName.trim(),
        ketuaClass: data.ketuaClass.trim(),
        wakilName: data.wakilName.trim(),
        wakilClass: data.wakilClass.trim(),
        photoUrl: data.photoUrl.trim() || undefined,
        vision: data.vision.trim() || undefined,
        mission: data.mission.trim() || undefined,
        programs: data.programs.trim() || undefined,
        isActive: data.isActive
      };

      if (editingCandidate) {
        await updateCandidate(editingCandidate.id, payload);
      } else {
        await createCandidate(payload);
      }
      closeSheet();
    } catch {
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await deleteCandidate(confirmDelete.id);
      setConfirmDelete(null);
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(candidate: CandidatePair, next: boolean) {
    if (!guardDraftOnly()) return;
    setTogglingId(candidate.id);
    try {
      await toggleActive(candidate.id, next);
    } catch {
    } finally {
      setTogglingId(null);
    }
  }

  if (electionsLoading && !selectedElection) {
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
              onClick={() => {
                refreshElections();
                refreshCandidates();
              }}
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

      {(electionsError || candidatesError) && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="text-sm">Terjadi kesalahan</AlertTitle>
          <AlertDescription className="text-xs">
            {electionsError || candidatesError}
          </AlertDescription>
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

              {candidatesLoading ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filtered.length === 0 ? (
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
                <CandidatesTable
                  candidates={filtered}
                  canEdit={canEdit}
                  onEdit={openEdit}
                  onDelete={setConfirmDelete}
                  onToggleActive={handleToggleActive}
                  togglingId={togglingId}
                  deletingId={deletingId}
                />
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
              <span className="mx-1">-</span>
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
                {editingCandidate ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingCandidate ? "Ubah paslon" : "Tambah paslon"}
              </SheetTitle>
              <SheetDescription>
                Isi data pasangan calon. Nomor urut wajib unik di pemilihan yang sama.
              </SheetDescription>
            </SheetHeader>
          </div>

          <CandidateForm
            key={editingCandidate ? editingCandidate.id : "create"}
            initialData={editingCandidate}
            onSubmit={handleFormSubmit}
            onCancel={closeSheet}
            isSubmitting={formSubmitting}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kandidat</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kandidat <b>{confirmDelete?.shortName}</b>?<br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
