import type { ReactElement } from "react";
import { Eye } from "@phosphor-icons/react";
import { ui } from "@/content/copy";
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
import { Tv } from "./Tv";

const CORNERS: { corner: Corner; label: string }[] = [
  { corner: "tl", label: "Top left widgets" },
  { corner: "tr", label: "Top right widgets" },
  { corner: "bl", label: "Bottom left widgets" },
  { corner: "br", label: "Bottom right widgets" },
];

/**
 * `locked` is true while a screen is open on top. The scene and widgets then go inert so keyboard focus and
 * assistive tech stay in the dialog; the TV is left out on purpose — it stays visible and hit-testable (spec §4.8).
 */
export const MainScreen = ({ locked = false }: { locked?: boolean }): React.JSX.Element => {
  // HUD size is a step (0.85–1.3) on top of the corner scaling (spec §4.4); the TV is positioned with the same scale.
  const scale = useHudScale() * useStore().state.hudSize;
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
      <div className="contents" inert={locked}>
      <Scene locationId={state.locationId} />
      {!state.hudHidden &&
        CORNERS.map(({ corner, label }) => (
          <CornerGroup key={corner} corner={corner} scale={scale} label={label}>
            {(Object.entries(DEFAULT_SLOTS) as [WidgetId, (typeof DEFAULT_SLOTS)[WidgetId]][])
              .filter(([id, slot]) => slot.corner === corner && id !== "music" && !state.hiddenWidgets.includes(id))
              .map(([id, slot]) => (
                <div key={id} style={id === "phone" ? { ...slotStyle(slot), width: "auto", height: "auto", minHeight: slot.h } : slotStyle(slot)} data-widget={id}>{widgets[id as keyof typeof widgets]}</div>
              ))}
          </CornerGroup>
        ))}
      </div>
      <Tv scale={scale} locked={locked} />
      {state.hudHidden && (
        <button type="button" onClick={() => dispatch({ type: "TOGGLE_HUD" })} className="absolute bottom-4 left-4 z-10 flex items-center gap-2 border-2 border-white bg-black px-3 py-2 font-body-primary text-white hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
          <Eye size={20} />{ui.showUi}
        </button>
      )}
    </main>
  );
};

export default MainScreen;
