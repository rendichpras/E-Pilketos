import { AspectRatio } from "@/components/ui/aspect-ratio";

type CandidatePhotoProps = {
  photoUrl: string | null | undefined;
  name: string;
  className?: string;
};

export function CandidatePhoto({ photoUrl, name, className }: CandidatePhotoProps) {
  return (
    <AspectRatio
      ratio={3 / 4}
      className={`bg-muted/40 overflow-hidden rounded-lg border ${className ?? ""}`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Foto ${name}`}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
          Foto belum tersedia
        </div>
      )}
    </AspectRatio>
  );
}
