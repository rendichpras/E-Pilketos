import { Suspense } from "react";
import SuksesClient from "./SuksesClient";
import { Spinner } from "@/components/ui/spinner";

export const dynamic = "force-dynamic";

export default function VoteSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <SuksesClient />
    </Suspense>
  );
}
