import { useState, type FormEvent } from "react";
import { CheckCircle, Circle, PencilSimple, Target } from "@phosphor-icons/react";
import { widgets } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import { Slab } from "../Slab";

/** One-line mission: empty → set → editing (spec §3.6). Setting the first one grants Knowledge via the reducer. */
export function MissionWidget() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const showInput = editing || state.mission === "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_MISSION", text: draft });
    setEditing(false);
  };

  return (
    <Slab className="flex h-full w-full flex-col justify-center gap-1 p-2" label="Mission">
      <div className="flex items-center gap-1 font-body-primary uppercase tracking-wide text-redbright"><Target size={18} aria-hidden="true" />Mission</div>
      {showInput ? (
        <form onSubmit={submit} className="flex gap-1">
          <input
            aria-label="Today's mission"
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={widgets.missionEmpty}
            className="min-w-0 flex-1 border border-white bg-black px-1 text-sm placeholder:text-muted-foreground"
          />
          <button type="submit" className="border border-white bg-redbright px-2 text-sm hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">Set</button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-1">
          <button type="button" role="checkbox" aria-checked={state.missionDone} aria-label="Mission done" onClick={() => dispatch({ type: "TOGGLE_MISSION_DONE" })} className="shrink-0 hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
            {state.missionDone ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
          </button>
          <p className={`min-w-0 flex-1 truncate text-sm ${state.missionDone ? "text-greylight line-through" : ""}`}>{state.mission}</p>
          <button type="button" aria-label="Edit mission" onClick={() => { setDraft(state.mission); setEditing(true); }} className="shrink-0 hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
            <PencilSimple size={16} />
          </button>
        </div>
      )}
    </Slab>
  );
}
