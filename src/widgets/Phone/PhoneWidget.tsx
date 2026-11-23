import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, DeviceMobile } from "@phosphor-icons/react";
import { SidePanel } from "@/components/ui/side-panel";
import { ui, widgets } from "@/content/copy";
import { THREADS } from "@/content/threads";
import { pendingAsk, type Message } from "@/domain/story";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";

const speaker = (from: string) => from.charAt(0).toUpperCase() + from.slice(1);

/**
 * Phone: Cult UI side panel that opens from a phone button with an unread badge. The list shows only the threads that have
 * started (nothing telegraphs what unlocks next, spec §3.4); a thread shows its messages, asks the question it is waiting on
 * (onboarding asks the player's name) and, for feedback, takes what the player writes (kept on this device for now).
 */
export function PhoneWidget() {
  const { state, dispatch } = useStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const thread = THREADS.find((t) => t.id === state.phoneThread);
  const progress = thread ? state.story[thread.id] : undefined;
  const started = THREADS.filter((t) => state.story[t.id]);

  // Opened from the menu or dev panel: move focus to the phone so keyboard users land on it.
  useEffect(() => {
    if (state.phoneOpen && document.activeElement === document.body) buttonRef.current?.focus();
  }, [state.phoneOpen]);

  // A thread that is open is a thread being read: new lines in it never leave it marked unread.
  const openId = state.phoneOpen ? state.phoneThread : null;
  const openUnread = openId !== null && state.unreadThreads.includes(openId);
  useEffect(() => {
    if (openId && openUnread) dispatch({ type: "READ_THREAD", id: openId });
  }, [openId, openUnread, dispatch]);

  const unread = state.unreadThreads.length;
  const asking = thread ? pendingAsk(thread, progress) : null;
  const onboarding = thread?.id === "morgana" && progress && !progress.done;

  return (
    <div className="pointer-events-auto font-body-primary text-white" role="region" aria-label="Phone">
      <SidePanel
        panelOpen={state.phoneOpen}
        handlePanelOpen={() => dispatch({ type: "SET_PHONE", open: !state.phoneOpen })}
        className={state.phoneOpen ? "border-2 border-white bg-black" : "w-fit border-2 border-white bg-black md:w-fit"}
        renderButton={(toggle) => (
          <button type="button" ref={buttonRef} onClick={toggle} aria-expanded={state.phoneOpen} aria-label={unread ? `Phone, ${unread} unread` : "Phone"} className="relative grid size-10 place-items-center hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
            <DeviceMobile size={28} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center bg-redbright px-1 text-[10px] leading-4">{unread}</span>}
          </button>
        )}
      >
        <div className="max-h-72 overflow-y-auto px-3 pb-3 text-sm">
          {thread && progress ? (
            <ThreadView
              key={thread.id}
              title={thread.title}
              messages={progress.messages}
              asking={asking}
              compose={!!thread.compose}
              onboarding={!!onboarding}
              onBack={() => dispatch({ type: "OPEN_THREAD", id: null })}
              onSend={(text) => dispatch(asking ? { type: "ANSWER_THREAD", id: thread.id, text } : { type: "POST_MESSAGE", id: thread.id, text })}
              onSkip={() => dispatch({ type: "SKIP_ONBOARDING" })}
            />
          ) : started.length === 0 ? (
            <p>{widgets.phoneEmpty}</p>
          ) : (
            <ul>
              {started.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => dispatch({ type: "OPEN_THREAD", id: t.id })} className="flex w-full items-center justify-between py-1 text-left hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
                    <span>{t.title}</span>
                    {state.unreadThreads.includes(t.id) && <span className="size-2 bg-redbright" role="img" aria-label="unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SidePanel>
    </div>
  );
}

function ThreadView({ title, messages, asking, compose, onboarding, onBack, onSend, onSkip }: {
  title: string; messages: Message[]; asking: "name" | "save_progress" | null; compose: boolean; onboarding: boolean;
  onBack: () => void; onSend: (text: string) => void; onSkip: () => void;
}) {
  const [text, setText] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const [first] = useState(messages.length); // lines already on screen when this view opened: only newer ones animate in
  useEffect(() => { log.current?.scrollTo?.({ top: log.current.scrollHeight }); }, [messages.length]);
  const canWrite = asking === "name" || compose;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-white focus-visible:outline-2 focus-visible:outline-accentteal"><ArrowLeft size={14} aria-hidden="true" />{title}</button>
        {onboarding && <button type="button" onClick={onSkip} className="border border-white px-1 text-xs hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal">{ui.thread.skip}</button>}
      </div>
      <div ref={log} role="log" aria-label={title} className="flex flex-col gap-1">
        {messages.map((m, i) => (
          <p key={i} style={i >= first && m.delayMs ? { animationDelay: `${m.delayMs}ms` } : undefined}
            className={cn("max-w-[90%] border px-2 py-1", m.side === "me" ? "self-end border-redbright bg-redbright text-white" : "self-start border-white", i >= first && "motion-safe:animate-gate-in")}>
            <span className="sr-only">{m.side === "me" ? ui.thread.you : speaker(m.from)}: </span>{m.text}
          </p>
        ))}
      </div>
      {canWrite && (
        <form onSubmit={submit} className="mt-2 flex gap-1">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} aria-label={asking === "name" ? ui.thread.yourName : ui.thread.writeFeedback}
            placeholder={asking === "name" ? ui.thread.yourName : ui.thread.writeFeedback} className="min-w-0 flex-1 border border-white bg-black px-2 py-1 focus-visible:outline-2 focus-visible:outline-accentteal" />
          <button type="submit" className="border border-white px-2 hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal">{ui.thread.send}</button>
        </form>
      )}
    </div>
  );
}
