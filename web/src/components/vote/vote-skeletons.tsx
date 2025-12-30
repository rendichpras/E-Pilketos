import { Skeleton } from "@/components/ui/skeleton";
import { VoteShell } from "@/components/vote/vote-shell";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function VoteLoginSkeleton() {
  return (
    <VoteShell className="flex items-center">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 md:h-10" />
            <Skeleton className="h-4 w-full max-w-[280px]" />
          </div>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="mb-6 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 flex flex-col gap-3 border-t pt-6">
              <Skeleton className="h-11 w-full" />
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </VoteShell>
  );
}

export function VoteSuratSuaraSkeleton() {
  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
        <div className="space-y-3 pt-4 md:pt-0">
          <Skeleton className="h-8 w-3/4 md:h-10 md:w-1/2" />
          <Skeleton className="h-5 w-full md:w-2/3" />
        </div>

        <div className="grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] w-full bg-muted/20 animate-pulse" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardFooter className="pt-0">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </VoteShell>
  );
}

export function VoteKonfirmasiSkeleton() {
  return (
    <VoteShell>
      <div className="space-y-7 pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 md:h-10" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="flex justify-between gap-3">
              <div className="space-y-1 w-full">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[320px_1fr] md:items-start">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </CardFooter>
        </Card>
      </div>

      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </div>
    </VoteShell>
  );
}
