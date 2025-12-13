import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Users2,
  KeySquare,
  BarChart3,
  ArrowRight
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard Admin - E-Pilketos"
};

const shortcuts = [
  {
    href: "/admin/elections",
    label: "Pemilihan",
    icon: FolderKanban,
    desc: "Atur identitas, jadwal, status, dan publikasi hasil.",
    hint: "Mulai dari sini sebelum konfigurasi lain."
  },
  {
    href: "/admin/candidates",
    label: "Kandidat",
    icon: Users2,
    desc: "Kelola pasangan calon (ketua & wakil) per pemilihan.",
    hint: "Pastikan nomor urut rapi & unik."
  },
  {
    href: "/admin/tokens",
    label: "Token",
    icon: KeySquare,
    desc: "Generate token pemilih, filter, export, dan cetak.",
    hint: "Siapkan token sebelum hari pemilihan."
  },
  {
    href: "/admin/results",
    label: "Hasil",
    icon: BarChart3,
    desc: "Pantau rekap suara dan ringkasan penggunaan token.",
    hint: "Gunakan setelah pemilihan berjalan/selesai."
  }
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
          ringkasan
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <LayoutDashboard className="h-6 w-6" />
              Dashboard
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Akses cepat ke konfigurasi utama: pemilihan, kandidat, token, dan hasil.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full text-[11px] font-medium">
            Panel admin
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start gap-3">
                  <div className="border-border/60 bg-muted/30 flex h-10 w-10 items-center justify-center rounded-2xl border">
                    <Icon className="text-muted-foreground h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base leading-none">{item.label}</CardTitle>
                    <CardDescription className="text-xs">{item.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-muted-foreground text-xs">{item.hint}</p>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 w-full rounded-full px-3 text-xs"
                >
                  <Link href={item.href}>
                    Buka
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Alur kerja rekomendasi</CardTitle>
              <CardDescription className="text-xs">
                Urutan aman untuk persiapan sampai hari pemilihan.
              </CardDescription>
            </div>

            <Badge variant="outline" className="w-fit rounded-full text-[11px] font-medium">
              Checklist
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <ol className="grid gap-3 md:grid-cols-4">
            <li className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full font-mono text-[11px]">
                  1
                </Badge>
                <span className="text-sm font-semibold">Pemilihan</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Buat slug, nama, deskripsi, jadwal, dan status.
              </p>
            </li>

            <li className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full font-mono text-[11px]">
                  2
                </Badge>
                <span className="text-sm font-semibold">Kandidat</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Tambah paslon dan pastikan nomor urut berurutan.
              </p>
            </li>

            <li className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full font-mono text-[11px]">
                  3
                </Badge>
                <span className="text-sm font-semibold">Token</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Generate, filter, export/cetak, lalu distribusikan.
              </p>
            </li>

            <li className="border-border/60 bg-muted/20 rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full font-mono text-[11px]">
                  4
                </Badge>
                <span className="text-sm font-semibold">Hasil</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Pantau suara & rekap token setelah voting berjalan.
              </p>
            </li>
          </ol>

          <Separator className="my-4" />

          <p className="text-muted-foreground text-xs">
            Jika tampilan data terasa berat, gunakan filter/pencarian dan batasi “per halaman” pada
            tabel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
