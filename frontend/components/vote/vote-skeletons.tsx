import { Skeleton } from "@/components/ui/skeleton";
import { VoteStepper } from "@/components/vote/vote-stepper";
import { Card, CardContent } from "@/components/ui/card";

export function VoteSuratSuaraSkeleton() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="space-y-5">
          <VoteStepper step={2} />

          <div className="space-y-2">
            <Skeleton className="h-6 w-72 md:h-9 md:w-[520px]" />
            <Skeleton className="h-4 w-[320px] md:w-[640px]" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-7 w-60 rounded-full" />
            <Skeleton className="h-7 w-64 rounded-full" />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-border/80 bg-card/95 overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-64" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-stretch gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-11 w-full md:w-56" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VoteKonfirmasiSkeleton() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-3xl space-y-6">
          <VoteStepper step={3} />

          <div className="space-y-2">
            <Skeleton className="h-6 w-64 md:h-9 md:w-[420px]" />
            <Skeleton className="h-4 w-[340px] md:w-[560px]" />
          </div>

          <div className="mx-auto w-full max-w-md">
            <Card className="border-border/80 bg-card/95 overflow-hidden shadow-sm">
              <CardContent className="space-y-4 p-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="space-y-2 text-center">
                  <Skeleton className="mx-auto h-5 w-44" />
                  <Skeleton className="mx-auto h-4 w-64" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
