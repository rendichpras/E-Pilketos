import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { Election } from "@/shared/types";

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

export type ElectionFormData = {
  slug: string;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
};

interface ElectionFormProps {
  initialData?: Election | null;
  onSubmit: (data: ElectionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ElectionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: ElectionFormProps) {
  const [form, setForm] = useState<ElectionFormData>(() => {
    if (initialData) {
      return {
        slug: initialData.slug,
        name: initialData.name,
        description: initialData.description ?? "",
        startAt: toDatetimeLocalValue(initialData.startAt),
        endAt: toDatetimeLocalValue(initialData.endAt)
      };
    }
    return {
      slug: "",
      name: "",
      description: "",
      startAt: "",
      endAt: ""
    };
  });

  const canEditSchedule = !initialData || initialData.status === "DRAFT";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const slug = form.slug.trim();
    const name = form.name.trim();
    const description = form.description.trim();

    if (!slug && !initialData) {
      toast.error("Slug wajib diisi saat membuat pemilihan.");
      return;
    }

    if (!name || !description) {
      toast.error("Nama dan deskripsi wajib diisi.");
      return;
    }

    if (canEditSchedule) {
      if (!form.startAt || !form.endAt) {
        toast.error("Waktu mulai dan selesai wajib diisi.");
        return;
      }

      const start = new Date(form.startAt).getTime();
      const end = new Date(form.endAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        toast.error("Waktu selesai harus setelah waktu mulai.");
        return;
      }
    }

    await onSubmit({ ...form, slug, name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug / URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            placeholder="contoh: pilketos-2025"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            disabled={!!initialData || isSubmitting}
            className="font-mono text-xs"
            autoComplete="off"
            autoFocus={!initialData}
          />
          {initialData && (
            <p className="text-muted-foreground text-[10px]">Slug tidak dapat diubah.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Nama Pemilihan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="contoh: Pemilihan Ketua OSIS 2024/2025"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Deskripsi <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Deskripsi singkat mengenai pemilihan ini..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startAt">
              Waktu Mulai <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              disabled={isSubmitting || !canEditSchedule}
              className="text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">
              Waktu Selesai <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              disabled={isSubmitting || !canEditSchedule}
              className="text-xs"
            />
          </div>
        </div>

        {!canEditSchedule && (
          <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-lg border p-3 text-[11px]">
            Jadwal tidak dapat diubah karena status pemilihan bukan DRAFT.
          </div>
        )}
      </div>

      <div className="bg-background flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
          {initialData ? "Simpan Perubahan" : "Buat Pemilihan"}
        </Button>
      </div>
    </form>
  );
}
