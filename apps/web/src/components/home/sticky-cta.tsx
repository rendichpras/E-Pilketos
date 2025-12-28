import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LockKeyholeOpen } from "lucide-react";

type StickyVoteCtaProps = {
  enabled: boolean;
};

export function StickyVoteCta({ enabled }: StickyVoteCtaProps) {
  if (!enabled) return null;

  return (
    <div className="bg-background/90 supports-backdrop-filter:bg-background/70 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
          <LockKeyholeOpen className="h-4 w-4" />
          <span>Bilik suara terbuka</span>
        </div>
        <Button asChild>
          <Link href="/vote">Masuk</Link>
        </Button>
      </div>
    </div>
  );
}
