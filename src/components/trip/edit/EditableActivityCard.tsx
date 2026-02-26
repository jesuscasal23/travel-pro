"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { getCategoryStyle, getCategoryEmoji } from "@/lib/utils/category-colors";
import { InlineActivityForm } from "./InlineActivityForm";
import type { EditableActivity } from "@/stores/useEditStore";

interface EditableActivityCardProps {
  activity: EditableActivity;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: EditableActivity) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function EditableActivityCard({
  activity,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
  isFirst,
  isLast,
}: EditableActivityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity._editId,
  });

  const [swipeX, setSwipeX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const touchStartX = useRef(0);
  const style = getCategoryStyle(activity.category);

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -68));
    else if (isSwiped) setSwipeX(Math.min(0, dx - 68));
  }

  function handleTouchEnd() {
    if (swipeX < -36) {
      setSwipeX(-68);
      setIsSwiped(true);
    } else {
      setSwipeX(0);
      setIsSwiped(false);
    }
  }

  const roundTop = isFirst ? "rounded-t-xl" : "";
  const roundBottom = !isExpanded && isLast ? "rounded-b-xl" : "";

  return (
    <div ref={setNodeRef} style={cardStyle} className="relative overflow-hidden">
      {/* Delete reveal */}
      <div className="bg-destructive absolute top-0 right-0 bottom-0 flex w-17 items-center justify-center">
        <button
          onClick={onDelete}
          className="flex flex-col items-center gap-0.5 px-3 text-white"
          aria-label="Delete activity"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      {/* Card body */}
      <div
        className="relative transition-transform"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`border-border bg-card relative border-x border-t ${roundTop} ${
            isLast && !isExpanded ? "border-b" : ""
          } ${roundBottom}`}
        >
          {/* Category accent */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-1 ${style.bgClass} ${
              isFirst ? "rounded-tl-xl" : ""
            } ${isLast && !isExpanded ? "rounded-bl-xl" : ""}`}
          />

          <div className="py-3 pr-3 pl-3">
            <div className="flex items-center gap-2">
              {/* Drag handle */}
              <button
                className="text-muted-foreground flex-shrink-0 cursor-grab touch-none active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Tap area to expand */}
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
              >
                <span className="flex-shrink-0 text-sm">
                  {activity.icon ?? getCategoryEmoji(activity.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {activity.name || (
                      <span className="text-muted-foreground italic">Unnamed activity</span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {activity.duration}
                    {activity.cost ? ` · ${activity.cost}` : ""}
                  </p>
                </div>
              </button>

              {/* Desktop delete icon */}
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive hidden flex-shrink-0 transition-colors sm:flex"
                aria-label="Delete activity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Inline form (expanded) */}
        {isExpanded && (
          <div
            className={`border-border bg-card border-x border-b ${isLast ? "overflow-hidden rounded-b-xl" : ""}`}
          >
            <InlineActivityForm activity={activity} onChange={onChange} onDone={onToggleExpand} />
          </div>
        )}
      </div>
    </div>
  );
}
