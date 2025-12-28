import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

const faqs = [
  {
    id: "token-invalid",
    question: "Token saya tidak valid. Apa yang harus saya lakukan?",
    answer:
      "Periksa penulisan token (tanpa spasi). Jika masih gagal, hubungi panitia untuk verifikasi."
  },
  {
    id: "token-used",
    question: "Token saya sudah digunakan. Bagaimana solusinya?",
    answer:
      "Token hanya bisa dipakai sekali. Hubungi panitia agar dilakukan pengecekan dan tindak lanjut sesuai prosedur."
  },
  {
    id: "session-expired",
    question: "Sesi habis saat memilih. Kenapa bisa begitu?",
    answer: "Silakan masuk ulang dari halaman token. Pastikan koneksi stabil saat proses pemilihan."
  },
  {
    id: "results",
    question: "Kenapa hasil belum muncul?",
    answer:
      "Hasil akan tampil setelah panitia mempublikasikan rekap setelah sesi pemilihan ditutup."
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
        <div className="mb-8 space-y-2">
          <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Info className="h-3.5 w-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Bantuan cepat.</h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Beberapa jawaban singkat untuk kasus yang paling sering terjadi.
          </p>
        </div>

        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
