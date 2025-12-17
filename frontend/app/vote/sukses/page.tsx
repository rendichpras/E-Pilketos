import { Suspense } from "react";
import SuksesClient from "./SuksesClient";

export default function VoteSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Memuat...</div>
        </div>
      }
    >
      <SuksesClient />
    </Suspense>
  );
}
