import { Suspense } from "react";
import KonfirmasiClient from "./KonfirmasiClient";

export const dynamic = "force-dynamic";

export default function VoteKonfirmasiPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Memuat...</div>
        </div>
      }
    >
      <KonfirmasiClient />
    </Suspense>
  );
}
