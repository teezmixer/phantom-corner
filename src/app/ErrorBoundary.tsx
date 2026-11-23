import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from "react";
import { sojiro, widgets } from "@/content/copy";

/**
 * What the player sees when the app breaks: Sojiro's line and one button (spec §3.11). It reads nothing from the store,
 * because the store may be what broke. Saved progress is written on every change, so a reload brings the seat back.
 */
function CrashCard({ onReload }: { onReload: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <div role="alert" data-testid="app-error" className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-black px-6 text-center font-body-primary text-white">
      <p className="font-display-hero text-4xl leading-tight">{sojiro.appError}</p>
      <button type="button" ref={button} onClick={onReload} className="border-2 border-white bg-redbright px-6 py-3 text-lg hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accentteal">
        {widgets.reload}
      </button>
    </div>
  );
}

interface Props {
  children: ReactNode;
  /** Called with the error once, so a test (or later a reporter) can see it. The default logs to the console. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** What "reload" does. Defaults to a real page reload; tests pass a spy. */
  onReload?: () => void;
}

/**
 * Catches a render error anywhere below it and swaps that subtree for the crash card. Used at the root and around each
 * screen layer, so a bug in one screen never leaves a blank page.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) this.props.onError(error, info);
    else console.error("Phantom Corner crashed:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <CrashCard onReload={this.props.onReload ?? (() => window.location.reload())} />;
  }
}
