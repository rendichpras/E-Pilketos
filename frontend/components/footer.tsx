import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const footerLinks = [
  { href: "/candidates", label: "Kandidat" },
  { href: "/results", label: "Hasil Hitung" },
  { href: "/vote", label: "Mulai Memilih" }
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border bg-background/95 border-t">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 text-center md:items-start md:text-left">
            <div className="text-foreground flex items-center justify-center gap-2 text-sm font-semibold md:justify-start">
              <Image
                src="/logo-osis.png"
                alt="Logo OSIS"
                width={16}
                height={16}
                className="h-8 w-auto object-contain md:h-9"
                priority
              />
              <span>E-Pilketos</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Sistem pemilihan ketua OSIS berbasis token, dirancang untuk proses yang jujur, rapi,
              dan mudah diaudit.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:justify-end">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <Separator className="my-4" />
        <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-[10px] md:flex-row">
          <p className="text-center md:text-left">
            &copy; {currentYear} Sistem Pemilihan Ketua OSIS. All rights reserved.
          </p>
          <div className="flex items-center gap-3 tracking-[0.18em] uppercase">
            <span className="font-mono">Anonim</span>
            <Separator orientation="vertical" className="h-3" />
            <span className="font-mono">Real-time</span>
            <Separator orientation="vertical" className="h-3" />
            <span className="font-mono">Terpercaya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
