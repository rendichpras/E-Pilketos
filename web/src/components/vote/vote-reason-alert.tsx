"use client";

import { useSearchParams } from "next/navigation";
import { getVoteReason } from "@/lib/vote-reason";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function VoteReasonAlert({ className }: { className?: string }) {
  const sp = useSearchParams();
  const reason = sp.get("reason");
  const data = getVoteReason(reason);

  if (!data) return null;

  const Icon = data.variant === "destructive" ? AlertCircle : Info;

  return (
    <Alert
      variant={data.variant === "destructive" ? "destructive" : undefined}
      className={cn("text-xs", className)}
    >
      <Icon className="h-4 w-4" />
      <AlertDescription>{data.message}</AlertDescription>
    </Alert>
  );
}
