import { useState, type FormEvent } from "react";
import { CaretDown, CaretUp, ListChecks, Plus } from "@phosphor-icons/react";
import { SortableList } from "@/components/ui/sortable-list";
import { widgets } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import { Slab } from "../Slab";

/** Add, tick, delete, reorder and collapse todos (spec §3.6). Persistence arrives with the storage adapter in M3. */
export function TodoWidget() {
  const { state, dispatch } = useStore();
  const collapsed = state.todoCollapsed; // saved with the other preferences
  const [draft, setDraft] = useState("");

  const add = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "ADD_TODO", text: draft });
    setDraft("");
  };

  return (
    <Slab className="flex h-full w-full flex-col gap-0.5 overflow-hidden px-2 py-1" label="Todo list">
      <div className="flex items-center justify-between font-body-primary uppercase tracking-wide text-white">
        <span className="flex items-center gap-1"><ListChecks size={18} className="text-redbright" aria-hidden="true" />Todo</span>
        <button type="button" aria-expanded={!collapsed} aria-label={collapsed ? "Expand todo list" : "Collapse todo list"} onClick={() => dispatch({ type: "SET_TODO_COLLAPSED", collapsed: !collapsed })} className="hover:text-white focus-visible:outline-2 focus-visible:outline-accentteal">
          {collapsed ? <CaretDown size={16} /> : <CaretUp size={16} />}
        </button>
      </div>
      {!collapsed && (
        <>
          <form onSubmit={add} className="flex gap-1">
            <input aria-label="Add a todo" value={draft} maxLength={80} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 border border-white bg-black px-1 text-sm" />
            <button type="submit" aria-label="Add todo" className="grid size-6 place-items-center border border-white bg-redbright hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal"><Plus size={14} /></button>
          </form>
          {state.todos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{widgets.todoEmpty}</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SortableList
                items={state.todos}
                onReorder={(items) => dispatch({ type: "SET_TODOS", todos: items })}
                onToggle={(id) => dispatch({ type: "TOGGLE_TODO", id })}
                onRemove={(id) => dispatch({ type: "DELETE_TODO", id })}
              />
            </div>
          )}
        </>
      )}
    </Slab>
  );
}
