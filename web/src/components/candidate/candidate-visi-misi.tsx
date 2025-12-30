import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CandidateVisiMisiProps = {
  vision: string | null | undefined;
  mission: string | null | undefined;
  programs: string | null | undefined;
  defaultTab?: "visi" | "misi" | "program";
};

export function CandidateVisiMisi({
  vision,
  mission,
  programs,
  defaultTab = "visi"
}: CandidateVisiMisiProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="visi">Visi</TabsTrigger>
        <TabsTrigger value="misi">Misi</TabsTrigger>
        <TabsTrigger value="program">Program</TabsTrigger>
      </TabsList>

      <TabsContent value="visi" className="mt-4">
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {vision?.trim() ? vision : "Belum ada data visi."}
        </p>
      </TabsContent>

      <TabsContent value="misi" className="mt-4">
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {mission?.trim() ? mission : "Belum ada data misi."}
        </p>
      </TabsContent>

      <TabsContent value="program" className="mt-4">
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {programs?.trim() ? programs : "Belum ada data program."}
        </p>
      </TabsContent>
    </Tabs>
  );
}
