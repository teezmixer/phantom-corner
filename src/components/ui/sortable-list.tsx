/**
 * Reorderable checklist adapted from Cult UI `sortable-list` (MIT, Nolly Studio — see credits).
 * Kept: drag-to-reorder with spring layout motion (motion `Reorder`). Changed: the Radix checkbox, "mark to delete"
 * semantics, 70%-width done state and all demo shadows/colours are replaced by a native checkbox, a separate delete
 * button and token surfaces. Tick = done; delete = remove.
 */
import { Reorder } from "motion/react";
import { Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface SortableItem {
  id: number;
  text: string;
  done: boolean;
}

interface SortableListProps {
  items: SortableItem[];
  onReorder: (items: SortableItem[]) => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  className?: string;
}

export function SortableList({ items, onReorder, onToggle, onRemove, className }: SortableListProps) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className={cn("flex flex-col gap-1", className)} aria-label="Todo list">
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className={cn("flex cursor-grab items-center gap-2 border border-border bg-secondary px-2 py-0.5 active:cursor-grabbing", item.done && "text-muted-foreground")}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => onToggle(item.id)}
            aria-label={`Done: ${item.text}`}
            className="size-4 shrink-0 accent-primary"
          />
          <span className={cn("min-w-0 flex-1 truncate text-sm", item.done && "line-through")}>{item.text}</span>
          <button
            type="button"
            aria-label={`Delete: ${item.text}`}
            onClick={() => onRemove(item.id)}
            className="grid size-5 shrink-0 place-items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Trash size={14} />
          </button>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
