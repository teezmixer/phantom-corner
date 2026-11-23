import type { ReactNode } from "react";
import type { StorageAdapter } from "@/state/persistence/adapter";
import type { Persisted } from "@/state/persistence/schema";
import { AccountProvider } from "./AccountProvider";
import { backend } from "./backend";
import { SyncDot } from "./SyncDot";

/** Gives the app its account. Its own file so that Root can load all of sync lazily, only when accounts are switched on. */
export default function AccountsRoot({ adapter, base, children }: { adapter: StorageAdapter; base: Persisted; children: ReactNode }) {
  return <AccountProvider backend={backend()} adapter={adapter} base={base}>{children}<SyncDot /></AccountProvider>;
}
