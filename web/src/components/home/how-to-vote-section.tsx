import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, ShieldCheck, Ticket, Users } from "lucide-react";

const steps = [
  {
    icon: <Ticket className="h-4 w-4" />,
    title: "Masukkan token",
    desc: "Gunakan token dari panitia. Token hanya bisa dipakai satu kali."
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: "Pilih paslon",
    desc: "Buka detail, bandingkan visi–misi, lalu tentukan pilihan."
  },
  {
    icon: <CheckCircle2 className="h-4 w-4" />,
    title: "Konfirmasi & kirim",
    desc: "Pastikan pilihan benar, lalu kirim suara untuk menyelesaikan proses."
  }
];

export function HowToVoteSection() {
  return (
    <section id="cara-memilih" className="bg-muted/30 border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 space-y-2">
          <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Cara memilih</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Selesai dalam tiga langkah.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Alurnya singkat, supaya pemilihan tetap cepat dan tertib.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title} className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader>
                <div className="bg-background/60 flex h-9 w-9 items-center justify-center rounded-full border">
                  {s.icon}
                </div>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription className="text-sm">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-dashed p-4 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4" />
            <p className="leading-relaxed">
              Jika token tidak valid atau sudah dipakai, hubungi panitia untuk pengecekan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
