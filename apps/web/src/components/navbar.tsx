"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

import { apiClient } from "@/lib/api-client";
import type { PublicActiveElectionResponse } from "@/lib/types";

const navLinks = [
  { href: "/#kandidat", label: "Kandidat" },
  { href: "/hasil", label: "Hasil" },
  { href: "/vote", label: "Mulai Memilih" }
];

export function Navbar() {
  const pathname = usePathname() || "/";
  const [voteState, setVoteState] = useState<"loading" | "open" | "closed">("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await apiClient.get<PublicActiveElectionResponse>("/public/elections/active");
        if (cancelled) return;
        setVoteState(data?.activeElection ? "open" : "closed");
      } catch {
        if (!cancelled) setVoteState("closed");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const voteEnabled = voteState === "open";
  const voteLabel =
    voteState === "loading"
      ? "Memeriksa Jadwal..."
      : voteState === "closed"
        ? "Pemilihan Belum Dibuka"
        : "Mulai Memilih";

  return (
    <header className="border-border bg-background/90 supports-backdrop-filter:bg-background/70 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-1 py-1 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo-osis.png"
            alt="Logo OSIS"
            width={32}
            height={32}
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-foreground text-sm font-semibold tracking-tight">E-Pilketos</span>
            <span className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">
              sistem pemilihan
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1">
            {navLinks.map((item) => {
              const isVote = item.href === "/vote";
              const isAnchor = item.href.includes("#");
              const active = isAnchor ? pathname === "/" : pathname.startsWith(item.href);

              if (isVote) return null;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="px-3 text-xs font-medium"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </div>

          {voteEnabled ? (
            <Button asChild size="sm" className="font-mono text-xs tracking-[0.16em] uppercase">
              <Link href="/vote">Mulai Memilih</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="font-mono text-xs tracking-[0.16em] uppercase"
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              {voteLabel}
            </Button>
          )}

          <div className="bg-border mx-1 hidden h-4 w-px md:block" />
          <ModeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex w-[80%] flex-col gap-0 px-0 sm:max-w-xs">
              <SheetHeader className="border-border border-b px-6 py-4 text-left">
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="/logo-osis.png"
                    alt="Logo OSIS"
                    height={32}
                    width={32}
                    className="h-8 w-auto object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">E-Pilketos</span>
                    <span className="text-muted-foreground text-[11px]">
                      Satu siswa, satu suara.
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col justify-between py-6">
                <nav className="flex flex-col gap-1 px-4">
                  {navLinks.map((item) => {
                    const isAnchor = item.href.includes("#");
                    const active = isAnchor ? pathname === "/" : pathname.startsWith(item.href);

                    if (item.href === "/vote" && !voteEnabled) {
                      return (
                        <div
                          key={item.href}
                          className={`flex cursor-not-allowed items-center gap-2 rounded-md px-4 py-3 text-sm font-medium opacity-60 transition-colors ${
                            active ? "bg-secondary text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <LockKeyhole className="h-4 w-4" />
                          {voteLabel}
                        </div>
                      );
                    }

                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="border-border text-muted-foreground mt-4 border-t px-6 pt-4 text-xs">
                  <p className="text-foreground font-medium">Satu siswa, satu suara.</p>
                  <p>Gunakan token yang diberikan panitia untuk mulai memilih.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
