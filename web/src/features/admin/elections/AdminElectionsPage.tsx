"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/features/admin/session/admin-context";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { CalendarClock, Plus, RefreshCw, XCircle } from "lucide-react";

import { useElections } from "./hooks/useElections";
import { ElectionsTable } from "./components/ElectionsTable";
import { ElectionForm, type ElectionFormData } from "./components/ElectionForm";

import type { Election, ElectionStatus } from "@/shared/types";
import { electionStatusBadge, resultPublicBadge } from "@/lib/badge-variants";
import { normalize } from "@/lib/search";

function formatDateTimeId(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

type TabValue = "all" | ElectionStatus;

export default function AdminElectionsPage() {
  const admin = useAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const {
    elections,
    loading,
    error,
    refresh,
    createElection,
    updateElection,
    activateElection,
    closeElection,
    publishResults,
    hideResults
  } = useElections();

  const [tab, setTab] = useState<TabValue>("all");
  const [query, setQuery] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [confirmActivate, setConfirmActivate] = useState<Election | null>(null);
  const [confirmClose, setConfirmClose] = useState<Election | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<Election | null>(null);
  const [confirmHide, setConfirmHide] = useState<Election | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const total = elections.length;
    const active = elections.filter((e) => e.status === "ACTIVE").length;
    const draft = elections.filter((e) => e.status === "DRAFT").length;
    const closed = elections.filter((e) => e.status === "CLOSED").length;
    const archived = elections.filter((e) => e.status === "ARCHIVED").length;
    return { total, active, draft, closed, archived };
  }, [elections]);

  const activeElection = useMemo(
    () => elections.find((e) => e.status === "ACTIVE") ?? null,
    [elections]
  );

  const filteredElections = useMemo(() => {
    const q = normalize(query);

    return elections
      .filter((e) => (tab === "all" ? true : e.status === tab))
      .filter((e) => {
        if (!q) return true;
        const hay = `${e.name} ${e.slug} ${e.description ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [elections, tab, query]);

  function openCreate() {
    setEditingElection(null);
    setSheetOpen(true);
  }

  function openEdit(election: Election) {
    setEditingElection(election);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingElection(null);
  }

  async function handleFormSubmit(data: ElectionFormData) {
    setFormSubmitting(true);
    try {
      if (editingElection) {
        await updateElection(editingElection.id, {
          name: data.name,
          description: data.description,
          startAt: new Date(data.startAt).toISOString(),
          endAt: new Date(data.endAt).toISOString()
        });
      } else {
        await createElection({
          slug: data.slug,
          name: data.name,
          description: data.description,
          startAt: new Date(data.startAt).toISOString(),
          endAt: new Date(data.endAt).toISOString()
        });
      }
      closeSheet();
    } catch {
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleAction(
    action: () => Promise<unknown>,
    setConfirm: (v: null) => void,
    electionId: string
  ) {
    setActionBusyId(electionId);
    try {
      await action();
      setConfirm(null);
    } catch {
    } finally {
      setActionBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-3/4 max-w-xl" />
        </div>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="border-border/60 border-b pb-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
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
              <CalendarClock className="h-6 w-6" />
              Pemilihan
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Kelola periode pemilihan. Satu waktu hanya boleh ada satu pemilihan berstatus ACTIVE.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={() => refresh()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="h-8 rounded-full px-4 text-[11px]" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Buat pemilihan
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4" />
            Terjadi kesalahan
          </AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {activeElection && (
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Periode aktif</CardTitle>
                <CardDescription className="text-xs">{activeElection.name}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={electionStatusBadge(activeElection.status)}>
                  {activeElection.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={resultPublicBadge(activeElection.isResultPublic)}
                >
                  {activeElection.isResultPublic ? "Hasil publik" : "Hasil privat"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-xs">
              {formatDateTimeId(activeElection.startAt)} – {formatDateTimeId(activeElection.endAt)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Daftar pemilihan</CardTitle>
              <CardDescription className="text-xs">
                Filter status, cari berdasarkan nama/slug, lalu kelola lewat menu aksi.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama, slug, deskripsi..."
                  className="pl-4"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList className="flex w-full flex-wrap justify-start gap-2 overflow-x-auto">
                {["all", "ACTIVE", "DRAFT", "CLOSED"].map((t) => (
                  <TabsTrigger key={t} value={t as TabValue} className="shrink-0 capitalize">
                    {t === "all" ? "Semua" : t.toLowerCase()}{" "}
                    <Badge variant="outline" className="ml-2 rounded-full text-[10px]">
                      {t === "all" ? counts.total : counts[t.toLowerCase() as keyof typeof counts]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="text-muted-foreground text-xs">
              Menampilkan <span className="font-medium">{filteredElections.length}</span> data
              {counts.archived > 0 ? (
                <>
                  {" "}
                  - Archived: <span className="font-medium">{counts.archived}</span>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ElectionsTable
            elections={filteredElections}
            onEdit={openEdit}
            onActivate={setConfirmActivate}
            onClose={setConfirmClose}
            onPublish={setConfirmPublish}
            onHide={setConfirmHide}
            isSuperAdmin={isSuperAdmin}
            actionBusyId={actionBusyId}
          />
        </CardContent>

        <CardFooter className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t pt-4 text-xs md:flex-row md:items-center md:justify-between">
          <div>Status ACTIVE hanya boleh satu. Aktivasi hanya untuk SUPER_ADMIN.</div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase">/admin/elections</div>
        </CardFooter>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : closeSheet())}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          <div className="border-border/60 border-b px-6 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2">
                {editingElection ? <RefreshCw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingElection ? "Ubah pemilihan" : "Buat pemilihan"}
              </SheetTitle>
              <SheetDescription>
                Lengkapi identitas dan jadwal. Slug hanya bisa diisi saat pembuatan. Publikasi hasil
                dilakukan lewat menu aksi (CLOSED only).
              </SheetDescription>
            </SheetHeader>
          </div>

          <ElectionForm
            key={editingElection ? editingElection.id : "create"}
            initialData={editingElection}
            onSubmit={handleFormSubmit}
            onCancel={closeSheet}
            isSubmitting={formSubmitting}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmActivate} onOpenChange={(o) => !o && setConfirmActivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Aktivasi</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengaktifkan <b>{confirmActivate?.name}</b>.<br />
              Pemilihan yang sedang ACTIVE saat ini (jika ada) akan otomatis diubah menjadi CLOSED.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmActivate &&
                handleAction(
                  () => activateElection(confirmActivate.id),
                  setConfirmActivate,
                  confirmActivate.id
                )
              }
              disabled={!!actionBusyId}
            >
              {actionBusyId ? "Memproses..." : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmClose} onOpenChange={(o) => !o && setConfirmClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penutupan</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menutup pemilihan <b>{confirmClose?.name}</b>.<br />
              Siswa tidak bisa memilih lagi setelah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                confirmClose &&
                handleAction(() => closeElection(confirmClose.id), setConfirmClose, confirmClose.id)
              }
              disabled={!!actionBusyId}
            >
              {actionBusyId ? "Memproses..." : "Ya, Tutup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmPublish} onOpenChange={(o) => !o && setConfirmPublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Publikasi</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mempublikasikan hasil pemilihan <b>{confirmPublish?.name}</b>.<br />
              Hasil akan dapat dilihat oleh publik di halaman utama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmPublish &&
                handleAction(
                  () => publishResults(confirmPublish.id),
                  setConfirmPublish,
                  confirmPublish.id
                )
              }
              disabled={!!actionBusyId}
            >
              {actionBusyId ? "Memproses..." : "Ya, Publikasikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmHide} onOpenChange={(o) => !o && setConfirmHide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Sembunyikan</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyembunyikan hasil pemilihan <b>{confirmHide?.name}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmHide &&
                handleAction(() => hideResults(confirmHide.id), setConfirmHide, confirmHide.id)
              }
              disabled={!!actionBusyId}
            >
              {actionBusyId ? "Memproses..." : "Ya, Sembunyikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
