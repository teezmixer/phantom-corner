import type { ReactElement } from "react";
import { Eye } from "@phosphor-icons/react";
import { CornerGroup, type Corner } from "@/hud/CornerGroup";
import { DEFAULT_SLOTS, slotStyle, type WidgetId } from "@/hud/slots";
import { useHudScale } from "@/hud/useHudScale";
import { useStore } from "@/state/StoreProvider";
import { ButtonBar } from "@/widgets/ButtonBar/ButtonBar";
import { DateTimeWidget } from "@/widgets/DateTime/DateTimeWidget";
import { LevelWidget } from "@/widgets/Level/LevelWidget";
import LocationWidget from "@/widgets/Location/LocationWidget";
import { MissionWidget } from "@/widgets/Mission/MissionWidget";
import { PhoneWidget } from "@/widgets/Phone/PhoneWidget";
import { TimerWidget } from "@/widgets/Timer/TimerWidget";
import { TodoWidget } from "@/widgets/Todo/TodoWidget";
import { Scene } from "./Scene";
import { TvPlaceholder } from "./TvPlaceholder";

const CORNERS: { corner: Corner; label: string }[] = [
  { corner: "tl", label: "Top left widgets" },
  { corner: "tr", label: "Top right widgets" },
  { corner: "bl", label: "Bottom left widgets" },
  { corner: "br", label: "Bottom right widgets" },
];

export const MainScreen = (): React.JSX.Element => {
  const scale = useHudScale();
  const { state, dispatch } = useStore();

  // The music slot is the TV, which lives outside the scaled groups (see TvPlaceholder).
  const widgets: Record<Exclude<WidgetId, "music">, ReactElement> = {
    date: <DateTimeWidget />,
    timer: <TimerWidget />,
    phone: <PhoneWidget />,
    mission: <MissionWidget />,
    todo: <TodoWidget />,
    level: <LevelWidget />,
    buttonBar: <ButtonBar />,
    location: <LocationWidget locationId={state.locationId} className="h-full w-full" />,
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-black">
      <Scene locationId={state.locationId} />
      {!state.hudHidden &&
        CORNERS.map(({ corner, label }) => (
          <CornerGroup key={corner} corner={corner} scale={scale} label={label}>
            {(Object.entries(DEFAULT_SLOTS) as [WidgetId, (typeof DEFAULT_SLOTS)[WidgetId]][])
              .filter(([id, slot]) => slot.corner === corner && id !== "music")
              .map(([id, slot]) => (
                <div key={id} style={slotStyle(slot)} data-widget={id}>{widgets[id as keyof typeof widgets]}</div>
              ))}
          </CornerGroup>
        ))}
      <TvPlaceholder scale={scale} />
      {state.hudHidden && (
        <button type="button" onClick={() => dispatch({ type: "TOGGLE_HUD" })} className="absolute bottom-4 left-4 z-10 flex items-center gap-2 border-2 border-white bg-black px-3 py-2 font-body-primary text-white hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
          <Eye size={20} />Show UI
        </button>
      )}
    </main>
  );
};

export default MainScreen;
