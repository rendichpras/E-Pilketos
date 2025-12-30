import { Badge } from "@/components/ui/badge";

type CandidateInfoProps = {
  ketuaName: string;
  ketuaClass: string;
  wakilName: string;
  wakilClass: string;
  layout?: "compact" | "expanded";
};

export function CandidateInfo({
  ketuaName,
  ketuaClass,
  wakilName,
  wakilClass,
  layout = "compact"
}: CandidateInfoProps) {
  if (layout === "expanded") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Badge variant="outline" className="text-[11px]">
            Ketua
          </Badge>
          <div className="leading-tight font-semibold">{ketuaName}</div>
          <div className="text-muted-foreground text-xs">{ketuaClass}</div>
        </div>

        <div className="space-y-1">
          <Badge variant="outline" className="text-[11px]">
            Wakil
          </Badge>
          <div className="leading-tight font-semibold">{wakilName}</div>
          <div className="text-muted-foreground text-xs">{wakilClass}</div>
        </div>
      </div>
    );
  }

  return (
    <span className="text-sm">
      <span className="text-foreground font-semibold">{ketuaName}</span>{" "}
      <span className="text-muted-foreground">({ketuaClass})</span>
      {" · "}
      <span className="text-foreground font-semibold">{wakilName}</span>{" "}
      <span className="text-muted-foreground">({wakilClass})</span>
    </span>
  );
}
