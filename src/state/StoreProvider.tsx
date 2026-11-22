import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { derive, reducer, type Action, type AppState, type Derived } from "./store";

interface StoreValue {
  state: AppState;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ initial, children }: { initial: AppState; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, derived: derive(state), dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
