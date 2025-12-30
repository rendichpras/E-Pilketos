import type { ReactNode } from "react";
import type { CandidatePair } from "@/shared/types";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

import { CandidatePhoto } from "./candidate-photo";
import { CandidateInfo } from "./candidate-info";
import { CandidateVisiMisi } from "./candidate-visi-misi";

type CandidateDrawerProps = {
  candidate: CandidatePair;
  electionName?: string | null;
  trigger?: ReactNode;
  actions?: ReactNode;
};

export function CandidateDrawer({
  candidate,
  electionName,
  trigger,
  actions
}: CandidateDrawerProps) {
  const title = candidate.shortName || `Paslon ${candidate.number}`;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="secondary" className="min-w-[76px]">
            Detail
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="h-[92vh] p-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base md:text-lg">
              Paslon {candidate.number} — {title}
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              {electionName ?? "Detail pasangan calon"}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <CandidatePhoto photoUrl={candidate.photoUrl} name={title} />

              <div className="space-y-4">
                <CandidateInfo
                  ketuaName={candidate.ketuaName}
                  ketuaClass={candidate.ketuaClass}
                  wakilName={candidate.wakilName}
                  wakilClass={candidate.wakilClass}
                  layout="expanded"
                />

                <Separator />

                <CandidateVisiMisi
                  vision={candidate.vision}
                  mission={candidate.mission}
                  programs={candidate.programs}
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="bg-muted/20 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-2">
            {actions}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Tutup
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
