import { useEffect, useRef } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useAudio } from "@/audio/AudioProvider";
import { morgana, splash } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";

/** Black splash: press to enter (the click also unlocks audio in M4), fan-project line, mute control. */
export function Splash() {
  const { state, dispatch } = useStore();
  const audio = useAudio();
  const enterRef = useRef<HTMLButtonElement>(null);
  // Deliberate: the single call to action takes focus so Enter or Space works at once.
  useEffect(() => enterRef.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black px-6 text-center font-body-primary text-white">
      <h1 className="font-display-hero text-6xl leading-none sm:text-8xl">PHANTOM<br />CORNER</h1>
      <button
        type="button"
        ref={enterRef}
        onClick={() => {
          audio.unlock(); // the click is the user gesture that lets audio start (spec §3.1)
          dispatch({ type: "ENTER" });
        }}
        className="border-2 border-white bg-redbright px-8 py-3 font-display-hero text-3xl hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accentteal"
      >
        {splash.enter}
      </button>
      {(state.recovered || state.storageBlocked) && (
        <p role="status" className="max-w-xl border-l-4 border-redbright pl-3 text-left text-sm">{state.storageBlocked ? morgana.cantWrite : morgana.scrambled}</p>
      )}
      <p className="max-w-xl text-sm text-greylight">{splash.disclaimer}</p>
      <div className="flex items-center gap-6 text-sm">
        <button type="button" aria-pressed={state.muted} onClick={() => dispatch({ type: "TOGGLE_MUTE" })} className="flex items-center gap-2 hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
          {state.muted ? <SpeakerSlash size={20} /> : <SpeakerHigh size={20} />}{state.muted ? splash.unmute : splash.mute}
        </button>
        <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "about" })} className="hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">About</button>
      </div>
    </div>
  );
}
