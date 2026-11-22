import { sessionEnd } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/** At zero (FigJam): go on, take five, change location, or finish. */
export function SessionEndScreen() {
  const { derived, dispatch } = useStore();
  return (
    <Overlay title={sessionEnd.heading} closable={false}>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })} className={buttonClass}>{sessionEnd.goOn}</button>
        <button type="button" onClick={() => dispatch({ type: "START_BREAK", now: Date.now() })} className={buttonClass}>{sessionEnd.takeFive}</button>
        <button type="button" disabled={!derived.mapOpen} onClick={() => dispatch({ type: "SET_LAYER", layer: "map" })} className={buttonClass}>{sessionEnd.changeLocation}</button>
        <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "summary" })} className={buttonClass}>{sessionEnd.finish}</button>
      </div>
    </Overlay>
  );
}
