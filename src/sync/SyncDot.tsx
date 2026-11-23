import { settings } from "@/content/copy";
import { useAccount } from "./AccountProvider";

/**
 * Spec §3.11 "sync down": a small red dot in the corner of the window while the server cannot be reached. It says nothing
 * else and blocks nothing; progress is on this device and goes up by itself when the connection is back.
 */
export function SyncDot() {
  const account = useAccount();
  if (!account?.who || account.sync !== "down") return null;
  return <span role="status" aria-label={settings.accountPanel.syncDown} title={settings.accountPanel.syncDown} className="pointer-events-none fixed bottom-1 left-1 z-40 size-3 rounded-full border border-white bg-redbright" />;
}
