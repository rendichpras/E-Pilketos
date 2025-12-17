"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { apiClient } from "@/lib/api-client";
import type { AdminUser, Election, ElectionStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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

import {
  CalendarClock,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  XCircle
} from "lucide-react";

type FormState = {
  slug: string;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
};

type TabValue = "all" | ElectionStatus;

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDateTimeId(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadgeClass(status: ElectionStatus) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    status === "ACTIVE" && "border-primary/40 bg-primary/10 text-primary",
    status === "CLOSED" && "border-destructive/40 bg-destructive/10 text-destructive",
    status === "DRAFT" && "bg-muted text-foreground/80 border-dashed",
    status === "ARCHIVED" && "border-border bg-muted/60 text-muted-foreground"
  );
}

function resultBadgeClass(isPublic: boolean) {
  return cn(
    "rounded-full px-2 py-0 text-[11px] font-medium",
    isPublic
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-border bg-muted text-muted-foreground"
  );
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export default function AdminElectionsPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const isSuperAdmin = admin?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);

  const [tab, setTab] = useState<TabValue>("all");
  const [query, setQuery] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmActivate, setConfirmActivate] = useState<Election | null>(null);
  const [confirmClose, setConfirmClose] = useState<Election | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const [confirmPublish, setConfirmPublish] = useState<Election | null>(null);
  const [confirmHide, setConfirmHide] = useState<Election | null>(null);
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null);

  const canEditSchedule = !editingId || editingElection?.status === "DRAFT";

  const [form, setForm] = useState<FormState>({
    slug: "",
    name: "",
    description: "",
    startAt: "",
    endAt: ""
  });

  function resetForm() {
    setForm({
      slug: "",
      name: "",
      description: "",
      startAt: "",
      endAt: ""
    });
  }

  async function loadElections({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<Election[]>("/admin/elections");
      setElections(data);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal memuat daftar pemilihan.";
      setError(message);
      toast.error(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await apiClient.get<AdminUser>("/admin/auth/me");
        if (!cancelled) setAdmin(me);
      } catch {}
    })();

    (async () => {
      try {
        const data = await apiClient.get<Election[]>("/admin/elections");
        if (cancelled) return;
        setElections(data);
      } catch (err: any) {
        if (cancelled) return;
        const message = err?.data?.error ?? "Gagal memuat daftar pemilihan.";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const hay = `${e.name} ${e.slug} ${e.description}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [elections, tab, query]);

  function openCreate() {
    setEditingId(null);
    setEditingElection(null);
    resetForm();
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(election: Election) {
    setEditingId(election.id);
    setEditingElection(election);
    setForm({
      slug: election.slug,
      name: election.name,
      description: election.description ?? "",
      startAt: toDatetimeLocalValue(election.startAt),
      endAt: toDatetimeLocalValue(election.endAt)
    });
    setError(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSubmitting(false);
    setEditingId(null);
    setEditingElection(null);
    resetForm();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    const slug = form.slug.trim();
    const name = form.name.trim();
    const description = form.description.trim();

    if (!slug && !editingId) {
      const msg = "Slug wajib diisi saat membuat pemilihan.";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    if (!name || !description) {
      const msg = "Nama dan deskripsi wajib diisi.";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    const mustValidateSchedule = !editingId || canEditSchedule;

    if (mustValidateSchedule) {
      if (!form.startAt || !form.endAt) {
        const msg = "Waktu mulai dan selesai wajib diisi.";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      const start = new Date(form.startAt).getTime();
      const end = new Date(form.endAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        const msg = "Waktu selesai harus setelah waktu mulai.";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingId) {
        const payload: Record<string, any> = {
          name,
          description
        };

        if (canEditSchedule) {
          payload.startAt = new Date(form.startAt).toISOString();
          payload.endAt = new Date(form.endAt).toISOString();
        }

        const updated = await apiClient.put<Election>(`/admin/elections/${editingId}`, payload);

        setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        toast.success("Pemilihan berhasil diperbarui.");
      } else {
        const created = await apiClient.post<Election>("/admin/elections", {
          slug,
          name,
          description,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString()
        });

        setElections((prev) => [created, ...prev]);
        toast.success("Pemilihan berhasil dibuat.");
      }

      closeSheet();
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal menyimpan pemilihan. Periksa kembali data Anda.";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  async function doActivate(election: Election) {
    if (!isSuperAdmin) {
      const msg = "Aksi ini hanya untuk SUPER_ADMIN.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setActionBusyId(election.id);
    setError(null);

    try {
      const updated = await apiClient.post<Election>(
        `/admin/elections/${election.id}/activate`,
        {}
      );

      setElections((prev) =>
        prev.map((e) =>
          e.id === updated.id ? updated : e.status === "ACTIVE" ? { ...e, status: "CLOSED" } : e
        )
      );

      toast.success("Pemilihan berhasil diaktifkan.");
      setConfirmActivate(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal mengaktifkan pemilihan sebagai aktif.";
      setError(message);
      toast.error(message);
    } finally {
      setActionBusyId(null);
    }
  }

  async function doClose(election: Election) {
    if (!isSuperAdmin) {
      const msg = "Aksi ini hanya untuk SUPER_ADMIN.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setActionBusyId(election.id);
    setError(null);

    try {
      const updated = await apiClient.post<Election>(`/admin/elections/${election.id}/close`, {});
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Pemilihan berhasil ditutup.");
      setConfirmClose(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal menutup pemilihan.";
      setError(message);
      toast.error(message);
    } finally {
      setActionBusyId(null);
    }
  }

  async function doPublishResults(election: Election) {
    if (!isSuperAdmin) {
      const msg = "Aksi ini hanya untuk SUPER_ADMIN.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setPublishBusyId(election.id);
    setError(null);

    try {
      const updated = await apiClient.post<Election>(
        `/admin/elections/${election.id}/publish-results`,
        {}
      );
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Hasil berhasil dipublikasikan.");
      setConfirmPublish(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal mempublikasikan hasil.";
      setError(message);
      toast.error(message);
    } finally {
      setPublishBusyId(null);
    }
  }

  async function doHideResults(election: Election) {
    if (!isSuperAdmin) {
      const msg = "Aksi ini hanya untuk SUPER_ADMIN.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setPublishBusyId(election.id);
    setError(null);

    try {
      const updated = await apiClient.post<Election>(
        `/admin/elections/${election.id}/hide-results`,
        {}
      );
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Hasil berhasil disembunyikan.");
      setConfirmHide(null);
    } catch (err: any) {
      const message = err?.data?.error ?? "Gagal menyembunyikan hasil.";
      setError(message);
      toast.error(message);
    } finally {
      setPublishBusyId(null);
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
              onClick={() => loadElections()}
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
                <Badge variant="outline" className={statusBadgeClass(activeElection.status)}>
                  {activeElection.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={resultBadgeClass(activeElection.isResultPublic)}
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
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama, slug, deskripsi..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList className="flex w-full flex-wrap justify-start gap-2 overflow-x-auto">
                <TabsTrigger value="all" className="shrink-0">
                  Semua{" "}
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {counts.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="ACTIVE" className="shrink-0">
                  Aktif{" "}
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {counts.active}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="DRAFT" className="shrink-0">
                  Draft{" "}
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {counts.draft}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="CLOSED" className="shrink-0">
                  Closed{" "}
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {counts.closed}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-muted-foreground text-xs">
              Menampilkan <span className="font-medium">{filteredElections.length}</span> data
              {counts.archived > 0 ? (
                <>
                  {" "}
                  • Archived: <span className="font-medium">{counts.archived}</span>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredElections.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
              <CalendarClock className="text-muted-foreground h-8 w-8" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Tidak ada data</p>
                <p className="text-muted-foreground text-xs">
                  Ubah filter atau buat periode pemilihan baru.
                </p>
              </div>
              <Button
                size="sm"
                className="mt-2 h-8 rounded-full px-4 text-[11px]"
                onClick={openCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat pemilihan
              </Button>
            </div>
          ) : (
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
                  {filteredElections.map((election) => (
                    <TableRow key={election.id} className="align-top">
                      <TableCell className="max-w-0">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-xs leading-snug font-medium">
                            {election.name}
                          </p>
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
                        <Badge variant="outline" className={statusBadgeClass(election.status)}>
                          {election.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center align-top">
                        <Badge
                          variant="outline"
                          className={resultBadgeClass(Boolean(election.isResultPublic))}
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

                            <DropdownMenuItem onClick={() => openEdit(election)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Ubah
                            </DropdownMenuItem>

                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>

                                {election.status === "DRAFT" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmActivate(election)}
                                    disabled={actionBusyId === election.id}
                                  >
                                    <Power className="mr-2 h-4 w-4" />
                                    Jadikan aktif
                                  </DropdownMenuItem>
                                )}

                                {election.status === "ACTIVE" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmClose(election)}
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
                                        onClick={() => setConfirmHide(election)}
                                        disabled={publishBusyId === election.id}
                                      >
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Sembunyikan hasil
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => setConfirmPublish(election)}
                                        disabled={publishBusyId === election.id}
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
          )}
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
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Ubah pemilihan" : "Buat pemilihan"}
              </SheetTitle>
              <SheetDescription>
                Lengkapi identitas dan jadwal. Slug hanya bisa diisi saat pembuatan. Publikasi hasil
                dilakukan lewat menu aksi (CLOSED only).
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 px-6 py-5">
              <div className="space-y-5">
                {editingId && !canEditSchedule && (
                  <Alert className="border-border/70 bg-muted/30">
                    <AlertTitle>Jadwal terkunci</AlertTitle>
                    <AlertDescription className="text-xs">
                      Pemilihan yang bukan DRAFT tidak bisa mengubah jadwal. Anda masih bisa
                      mengubah nama dan deskripsi.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    disabled={Boolean(editingId)}
                    placeholder="misal: pilketos-2026"
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Huruf kecil, angka, dan tanda hubung.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama pemilihan</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="misal: Pemilihan Ketua dan Wakil Ketua OSIS 2026"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Tuliskan deskripsi singkat mengenai tujuan dan lingkup pemilihan."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">Mulai</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                      disabled={submitting || (Boolean(editingId) && !canEditSchedule)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt">Selesai</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                      disabled={submitting || (Boolean(editingId) && !canEditSchedule)}
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={closeSheet}
                  disabled={submitting}
                >
                  Batal
                </Button>

                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        open={Boolean(confirmActivate)}
        onOpenChange={(open) => !open && setConfirmActivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jadikan pemilihan aktif?</AlertDialogTitle>
            <AlertDialogDescription>
              Pemilihan yang sebelumnya ACTIVE akan otomatis menjadi CLOSED.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmActivate ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-medium">{confirmActivate.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {formatDateTimeId(confirmActivate.startAt)} –{" "}
                {formatDateTimeId(confirmActivate.endAt)}
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusyId === confirmActivate?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmActivate && doActivate(confirmActivate)}
              disabled={!confirmActivate || actionBusyId === confirmActivate.id}
            >
              {actionBusyId === confirmActivate?.id ? "Memproses..." : "Jadikan aktif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(confirmClose)}
        onOpenChange={(open) => !open && setConfirmClose(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup pemilihan?</AlertDialogTitle>
            <AlertDialogDescription>Setelah ditutup, status menjadi CLOSED.</AlertDialogDescription>
          </AlertDialogHeader>

          {confirmClose ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-medium">{confirmClose.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {formatDateTimeId(confirmClose.startAt)} – {formatDateTimeId(confirmClose.endAt)}
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusyId === confirmClose?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmClose && doClose(confirmClose)}
              disabled={!confirmClose || actionBusyId === confirmClose.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionBusyId === confirmClose?.id ? "Memproses..." : "Tutup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(confirmPublish)}
        onOpenChange={(open) => !open && setConfirmPublish(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publikasikan hasil?</AlertDialogTitle>
            <AlertDialogDescription>
              Hasil pemilihan akan dapat dilihat publik pada halaman hasil.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmPublish ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-medium">{confirmPublish.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Status: <span className="font-medium">{confirmPublish.status}</span>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishBusyId === confirmPublish?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPublish && doPublishResults(confirmPublish)}
              disabled={!confirmPublish || publishBusyId === confirmPublish.id}
            >
              {publishBusyId === confirmPublish?.id ? "Memproses..." : "Publikasikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(confirmHide)}
        onOpenChange={(open) => !open && setConfirmHide(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sembunyikan hasil?</AlertDialogTitle>
            <AlertDialogDescription>
              Hasil pemilihan tidak akan dapat dilihat publik sampai dipublikasikan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmHide ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border p-3 text-sm">
              <div className="font-medium">{confirmHide.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Status: <span className="font-medium">{confirmHide.status}</span>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishBusyId === confirmHide?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmHide && doHideResults(confirmHide)}
              disabled={!confirmHide || publishBusyId === confirmHide.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {publishBusyId === confirmHide?.id ? "Memproses..." : "Sembunyikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
