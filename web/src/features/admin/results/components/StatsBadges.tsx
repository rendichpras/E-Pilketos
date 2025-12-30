import { Badge } from "@/components/ui/badge";
import { KeyRound, Users2 } from "lucide-react";
import type { TokenStats } from "@/shared/types";

interface StatsBadgesProps {
  tokenStats?: TokenStats;
  totalVotes: number;
}

export function StatsBadges({ tokenStats, totalVotes }: StatsBadgesProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="rounded-full text-[11px] font-medium">
        <KeyRound className="mr-1 h-3.5 w-3.5" />
        Token: {tokenStats?.total ?? 0}
      </Badge>
      <Badge variant="outline" className="rounded-full text-[11px] font-medium">
        Used: {tokenStats?.used ?? 0}
      </Badge>
      <Badge variant="outline" className="rounded-full text-[11px] font-medium">
        Unused: {tokenStats?.unused ?? 0}
      </Badge>
      <Badge
        variant="outline"
        className="border-destructive/60 bg-destructive/10 text-destructive rounded-full text-[11px] font-medium"
      >
        Invalid: {tokenStats?.invalidated ?? 0}
      </Badge>
      <Badge variant="outline" className="rounded-full text-[11px] font-medium">
        <Users2 className="mr-1 h-3.5 w-3.5" />
        Total suara: {totalVotes}
      </Badge>
    </div>
  );
}
