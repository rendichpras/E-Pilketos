import { Suspense } from "react";
import VoteClient from "./VoteClient";

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Memuat...</div>
        </div>
      }
    >
      <VoteClient />
    </Suspense>
  );
}
