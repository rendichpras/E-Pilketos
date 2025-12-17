import { Suspense } from "react";
import KonfirmasiClient from "./KonfirmasiClient";
import { VoteKonfirmasiSkeleton } from "@/components/vote/vote-skeletons";

export const dynamic = "force-dynamic";

export default function VoteKonfirmasiPage() {
  return (
    <Suspense fallback={<VoteKonfirmasiSkeleton />}>
      <KonfirmasiClient />
    </Suspense>
  );
}
