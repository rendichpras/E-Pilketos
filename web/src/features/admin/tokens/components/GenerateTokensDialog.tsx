import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import type { GenerateTokensDto } from "@/shared/types";

interface GenerateTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GenerateTokensDto) => Promise<void>;
  isGenerating: boolean;
}

export function GenerateTokensDialog({
  open,
  onOpenChange,
  onSubmit,
  isGenerating
}: GenerateTokensDialogProps) {
  const [count, setCount] = useState("");
  const [batchLabel, setBatchLabel] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const c = Number.parseInt(count, 10);
    if (Number.isNaN(c) || c <= 0) {
      toast.error("Jumlah token harus angka positif.");
      return;
    }

    await onSubmit({
      count: c,
      batch: batchLabel.trim() || undefined
    });

    setCount("");
    setBatchLabel("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <div className="border-border/60 border-b px-6 pt-6 pb-4">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Token
            </SheetTitle>
            <SheetDescription>
              Buat sejumlah token acak sekaligus. Opsional: beri label batch untuk memudahkan
              pengelompokan saat dicetak.
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="count">
                Jumlah Token <span className="text-destructive">*</span>
              </Label>
              <Input
                id="count"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                inputMode="numeric"
                placeholder="misal: 50"
                disabled={isGenerating}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Label Batch (Opsional)</Label>
              <Input
                id="batch"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                placeholder="misal: KELAS-X-RPL"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="bg-background flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating && <Spinner className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
