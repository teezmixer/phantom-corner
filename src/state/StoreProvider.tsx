import { createContext, useCallback, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { derive, reducer, type Action, type AppState, type Derived } from "./store";
import { usePersistence, type PersistenceConfig } from "./persistence/usePersistence";

interface StoreValue {
  state: AppState;
  derived: Derived;
  dispatch: Dispatch<Action>;
  /** True when progress is being saved to this browser (false in demo and dev modes, and in a tab without the session lock). */
  persistent: boolean;
  /** Delete everything stored and reload to a true first visit. Only meaningful when `persistent`. */
  wipe: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ initial, persistence, children }: { initial: AppState; persistence?: PersistenceConfig; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const onWriteFailed = useCallback(() => dispatch({ type: "STORAGE_FAILED" }), []);
  const { wipe } = usePersistence(state, persistence, onWriteFailed);
  const persistent = !!persistence?.enabled;
  const value = useMemo(() => ({ state, derived: derive(state), dispatch, persistent, wipe }), [state, persistent, wipe]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
