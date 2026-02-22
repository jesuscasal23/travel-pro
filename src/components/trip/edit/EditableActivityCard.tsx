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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: activity._editId });

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
      <div className="absolute right-0 top-0 bottom-0 w-17 flex items-center justify-center bg-destructive">
        <button
          onClick={onDelete}
          className="flex flex-col items-center gap-0.5 px-3 text-white"
          aria-label="Delete activity"
        >
          <Trash2 className="w-4 h-4" />
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
          className={`relative border-x border-t border-border bg-card ${roundTop} ${
            isLast && !isExpanded ? "border-b" : ""
          } ${roundBottom}`}
        >
          {/* Category accent */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${style.bgClass} ${
              isFirst ? "rounded-tl-xl" : ""
            } ${isLast && !isExpanded ? "rounded-bl-xl" : ""}`}
          />

          <div className="pl-3 pr-3 py-3">
            <div className="flex items-center gap-2">
              {/* Drag handle */}
              <button
                className="flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Tap area to expand */}
              <button
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
              >
                <span className="text-sm flex-shrink-0">
                  {activity.icon ?? getCategoryEmoji(activity.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {activity.name || <span className="text-muted-foreground italic">Unnamed activity</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[activity.duration, activity.cost].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>

              {/* Desktop delete icon */}
              <button
                onClick={onDelete}
                className="hidden sm:flex flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete activity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Inline form (expanded) */}
        {isExpanded && (
          <div
            className={`border-x border-b border-border bg-card ${isLast ? "rounded-b-xl overflow-hidden" : ""}`}
          >
            <InlineActivityForm
              activity={activity}
              onChange={onChange}
              onDone={onToggleExpand}
            />
          </div>
        )}
      </div>
    </div>
  );
}
