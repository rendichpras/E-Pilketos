import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CandidatePair } from "@/shared/types";

export type CandidateFormData = {
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

interface CandidateFormProps {
  initialData?: CandidatePair | null;
  onSubmit: (data: CandidateFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CandidateForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: CandidateFormProps) {
  const [form, setForm] = useState<CandidateFormData>(() => {
    if (initialData) {
      return {
        number: String(initialData.number),
        shortName: initialData.shortName,
        ketuaName: initialData.ketuaName,
        ketuaClass: initialData.ketuaClass,
        wakilName: initialData.wakilName,
        wakilClass: initialData.wakilClass,
        photoUrl: initialData.photoUrl ?? "",
        vision: initialData.vision ?? "",
        mission: initialData.mission ?? "",
        programs: initialData.programs ?? "",
        isActive: initialData.isActive
      };
    }
    return {
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
    };
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const number = Number.parseInt(form.number, 10);
    if (Number.isNaN(number) || number <= 0) {
      toast.error("Nomor urut wajib berupa angka positif.");
      return;
    }

    if (
      !form.shortName.trim() ||
      !form.ketuaName.trim() ||
      !form.ketuaClass.trim() ||
      !form.wakilName.trim() ||
      !form.wakilClass.trim()
    ) {
      toast.error("Nama singkat, ketua, kelas ketua, wakil, dan kelas wakil wajib diisi.");
      return;
    }

    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-6 py-5">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number">
                Nomor Urut <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                value={form.number}
                onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                inputMode="numeric"
                placeholder="1, 2, 3, ..."
                disabled={isSubmitting}
                autoFocus={!initialData}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">
                Nama Singkat Paslon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shortName"
                value={form.shortName}
                onChange={(e) => setForm((p) => ({ ...p, shortName: e.target.value }))}
                placeholder="misal: Harmoni Aksi"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ketuaName">
                Nama Ketua <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ketuaName"
                value={form.ketuaName}
                onChange={(e) => setForm((p) => ({ ...p, ketuaName: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ketuaClass">
                Kelas Ketua <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ketuaClass"
                value={form.ketuaClass}
                onChange={(e) => setForm((p) => ({ ...p, ketuaClass: e.target.value }))}
                disabled={isSubmitting}
                placeholder="Contoh: XI RPL 1"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wakilName">
                Nama Wakil <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wakilName"
                value={form.wakilName}
                onChange={(e) => setForm((p) => ({ ...p, wakilName: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wakilClass">
                Kelas Wakil <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wakilClass"
                value={form.wakilClass}
                onChange={(e) => setForm((p) => ({ ...p, wakilClass: e.target.value }))}
                disabled={isSubmitting}
                placeholder="Contoh: X TKJ 2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">URL Foto (Opsional)</Label>
            <Input
              id="photoUrl"
              value={form.photoUrl}
              onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Visi (Opsional)</Label>
            <Textarea
              id="vision"
              value={form.vision}
              onChange={(e) => setForm((p) => ({ ...p, vision: e.target.value }))}
              placeholder="Visi pasangan calon..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Misi (Opsional)</Label>
            <Textarea
              id="mission"
              value={form.mission}
              onChange={(e) => setForm((p) => ({ ...p, mission: e.target.value }))}
              placeholder="Misi pasangan calon..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programs">Program Kerja (Opsional)</Label>
            <Textarea
              id="programs"
              value={form.programs}
              onChange={(e) => setForm((p) => ({ ...p, programs: e.target.value }))}
              placeholder="Program unggulan..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>
      </ScrollArea>

      <div className="bg-background flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
          {initialData ? "Simpan Perubahan" : "Tambah Paslon"}
        </Button>
      </div>
    </form>
  );
}
