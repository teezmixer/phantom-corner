import { useState } from "react";
import { ArrowLeft, DeviceMobile } from "@phosphor-icons/react";
import { SidePanel } from "@/components/ui/side-panel";
import { widgets } from "@/content/copy";
import { THREADS } from "@/content/threads";
import { useStore } from "@/state/StoreProvider";

/**
 * Phone: Cult UI side panel that opens from a phone button with an unread badge. Lists every thread (spec §3.6);
 * message steps and the thread interpreter arrive in M8, so a thread shows a draft placeholder line for now.
 */
export function PhoneWidget() {
  const { state, dispatch } = useStore();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const unread = state.unreadThreads.length;
  const thread = THREADS.find((t) => t.id === openThread);

  const open = (id: string) => {
    setOpenThread(id);
    dispatch({ type: "READ_THREAD", id });
  };

  return (
    <div className="pointer-events-auto font-body-primary text-white" role="region" aria-label="Phone">
      <SidePanel
        panelOpen={state.phoneOpen}
        handlePanelOpen={() => dispatch({ type: "SET_PHONE", open: !state.phoneOpen })}
        className="rounded-none border-2 border-white bg-black"
        renderButton={(toggle) => (
          <button type="button" onClick={toggle} aria-expanded={state.phoneOpen} aria-label={unread ? `Phone, ${unread} unread` : "Phone"} className="relative grid size-10 place-items-center hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
            <DeviceMobile size={28} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center bg-redbright px-1 text-[10px] leading-4">{unread}</span>}
          </button>
        )}
      >
        <div className="max-h-64 overflow-y-auto px-3 pb-3 text-sm">
          {thread ? (
            <div>
              <button type="button" onClick={() => setOpenThread(null)} className="mb-2 flex items-center gap-1 text-redbright focus-visible:outline-2 focus-visible:outline-accentteal"><ArrowLeft size={14} />{thread.title}</button>
              <p className="border border-white p-2">{thread.placeholder}</p>
            </div>
          ) : (
            <ul>
              {THREADS.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => open(t.id)} className="flex w-full items-center justify-between py-1 text-left hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
                    <span>{t.title}</span>
                    {state.unreadThreads.includes(t.id) && <span className="size-2 bg-redbright" aria-label="unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {THREADS.length === 0 && <p>{widgets.phoneEmpty}</p>}
        </div>
      </SidePanel>
    </div>
  );
}
