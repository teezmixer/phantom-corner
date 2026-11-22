import { GraduationCap } from "@phosphor-icons/react";
import { HaloProgress } from "@/components/ui/halo-progress";
import { RollingNumber } from "@/components/ui/rolling-number";
import { levelProgress } from "@/domain/progress";
import { useStore } from "@/state/StoreProvider";
import { Slab } from "../Slab";

/** Level and Knowledge ("XP" is shown as Knowledge — spec §3.4). The bar is progress within the current level. */
export function LevelWidget() {
  const { derived } = useStore();
  const progress = levelProgress(derived.knowledge);
  return (
    <Slab className="flex h-full w-full flex-col justify-between p-2" label="Level and Knowledge">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-body-primary uppercase tracking-wide text-redbright"><GraduationCap size={20} aria-hidden="true" />Lv</span>
        <span className="font-display-hero text-4xl leading-none"><RollingNumber value={derived.level} /></span>
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span>Knowledge</span>
        <span className="tabular-nums"><RollingNumber value={derived.knowledge} /></span>
      </div>
      <HaloProgress value={progress.percent} aria-label="Progress to the next level" />
    </Slab>
  );
}
