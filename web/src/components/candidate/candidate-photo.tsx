import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

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
        <Image
          src={photoUrl}
          alt={`Foto ${name}`}
          fill
          className="object-cover object-top"
          unoptimized
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
          Foto belum tersedia
        </div>
      )}
    </AspectRatio>
  );
}
