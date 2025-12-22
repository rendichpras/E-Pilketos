"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadVoteSelection } from "@/lib/vote-selection";
import { VoteShell } from "@/components/vote/vote-shell";
import { VoteHeader } from "@/components/vote/vote-header";
import { VoteSelectionSummary } from "@/components/vote/vote-selection-summary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock } from "lucide-react";

export default function SuksesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const selection = useMemo(() => loadVoteSelection(), []);

  const copy = useMemo(() => {
    const reason = sp.get("reason");
    if (reason === "token_used") {
      return {
        title: "Token sudah digunakan.",
        desc: "Jika Anda sudah melakukan pemilihan sebelumnya, suara Anda sudah tercatat. Jika Anda belum memilih, hubungi panitia."
      };
    }
    return {
      title: "Suara Anda sudah tercatat.",
      desc: "Terima kasih. Token yang Anda gunakan telah dinonaktifkan otomatis untuk menjaga integritas pemilihan."
    };
  }, [sp]);

  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <VoteHeader
          step={3}
          eyebrow="SUKSES"
          title={copy.title}
          description={copy.desc}
          electionName={selection?.election?.name ?? null}
          electionRange={null}
        />

        <div className="mx-auto w-full max-w-md space-y-4">
          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardContent className="space-y-6 py-8 text-center">
              <div className="flex justify-center">
                <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>

              {selection ? (
                <VoteSelectionSummary
                  candidate={selection.candidate}
                  election={selection.election}
                  selectedAt={selection.selectedAt}
                  title="Ringkasan Pilihan Anda"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg border p-4 text-left">
                  <p className="text-muted-foreground text-sm">
                    Ringkasan pilihan tidak tersedia. Suara Anda tetap telah tercatat.
                  </p>
                </div>
              )}

              <div className="bg-muted/30 rounded-lg border p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                    hasil rekap
                  </p>
                  <span className="bg-background inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-[0.16em] uppercase">
                    belum publik
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Hasil belum dibuka oleh panitia. Silakan cek kembali nanti.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                  onClick={() => router.replace("/vote")}
                >
                  Kembali
                </Button>

                <Button
                  variant="outline"
                  className="w-full font-mono text-xs tracking-[0.18em] uppercase"
                  disabled
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Hasil Belum Dipublikasikan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VoteShell>
  );
}
