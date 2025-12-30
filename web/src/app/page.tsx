import Link from "next/link";

import { publicGet, ServerApiError } from "@/lib/api/server";
import type {
  Election,
  PublicActiveElectionResponse,
  PublicCandidatesResponse
} from "@/shared/types";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

import {
  StatusCard,
  CandidatesSection,
  HowToVoteSection,
  FaqSection,
  StickyVoteCta,
  getElectionStatus,
  isVoteEnabled,
  getVoteDisabledLabel
} from "@/components/home";

async function fetchActiveElection(): Promise<Election | null> {
  try {
    const data = await publicGet<PublicActiveElectionResponse>("/public/elections/active", {
      cache: "no-store"
    });
    return data.activeElection ?? null;
  } catch (err) {
    if (err instanceof ServerApiError) {
      console.error("Failed to fetch active election:", err.message);
    }
    return null;
  }
}

async function fetchPublicCandidates(): Promise<PublicCandidatesResponse | null> {
  try {
    return await publicGet<PublicCandidatesResponse>("/public/candidates", {
      cache: "no-store"
    });
  } catch (err) {
    if (err instanceof ServerApiError) {
      console.error("Failed to fetch candidates:", err.message);
    }
    return null;
  }
}

export default async function HomePage() {
  const [activeElection, candidatesData] = await Promise.all([
    fetchActiveElection(),
    fetchPublicCandidates()
  ]);

  const now = new Date();
  const statusInfo = getElectionStatus(activeElection, now);
  const voteEnabled = isVoteEnabled(activeElection, now);
  const voteDisabledLabel = getVoteDisabledLabel(statusInfo.status);

  const candidates = candidatesData?.candidates ?? [];
  const electionName = candidatesData?.election?.name ?? activeElection?.name ?? null;
  const electionSlug = activeElection?.slug ?? candidatesData?.election?.slug ?? null;

  return (
    <div
      className={
        voteEnabled
          ? "flex min-h-screen flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
          : "flex min-h-screen flex-col"
      }
    >
      <Navbar />

      <main className="flex-1">
        <section className="border-b">
          <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={voteEnabled ? "default" : "secondary"} className="text-xs">
                  {statusInfo.label}
                </Badge>
                {electionSlug ? (
                  <Badge variant="outline" className="text-xs">
                    {electionSlug}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl lg:text-6xl">
                  Pemilihan Ketua & Wakil OSIS
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  Siapkan token dari panitia untuk masuk ke bilik suara. Token hanya bisa dipakai
                  satu kali.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {voteEnabled ? (
                  <Button asChild size="lg">
                    <Link href="/vote">Masuk Bilik Suara</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled title={voteDisabledLabel}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    {voteDisabledLabel}
                  </Button>
                )}

                <Button asChild size="lg" variant="outline">
                  <Link href="/#kandidat">Lihat Paslon</Link>
                </Button>
              </div>
            </div>

            <StatusCard
              election={activeElection}
              status={statusInfo.status}
              label={statusInfo.label}
              description={statusInfo.description}
              now={now}
            />
          </div>
        </section>

        <CandidatesSection
          electionName={electionName}
          candidates={candidates}
          voteEnabled={voteEnabled}
          voteDisabledLabel={voteDisabledLabel}
        />

        <HowToVoteSection />
        <FaqSection />
        <StickyVoteCta enabled={voteEnabled} />
      </main>

      <Footer />
    </div>
  );
}
