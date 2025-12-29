import { Suspense } from "react";
import VoteClient from "./VoteClient";
import { VoteLoginSkeleton } from "@/components/vote/vote-skeletons";

export default function VotePage() {
  return (
    <Suspense fallback={<VoteLoginSkeleton />}>
      <VoteClient />
    </Suspense>
  );
}
