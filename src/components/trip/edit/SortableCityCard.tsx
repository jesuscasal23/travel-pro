"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import type { CityStop } from "@/types";

interface SortableCityCardProps {
  city: CityStop;
  onDaysChange: (cityId: string, newDays: number) => void;
  onRemove: (cityId: string) => void;
}

export function SortableCityCard({ city, onDaysChange, onRemove }: SortableCityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: city.id,
  });

  const [swipeX, setSwipeX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const touchStartX = useRef(0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) {
      setSwipeX(Math.max(dx, -72));
    } else if (isSwiped) {
      setSwipeX(Math.min(0, dx - 72));
    }
  }

  function handleTouchEnd() {
    if (swipeX < -40) {
      setSwipeX(-72);
      setIsSwiped(true);
    } else {
      setSwipeX(0);
      setIsSwiped(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="relative overflow-hidden">
      {/* Delete reveal (behind card) */}
      <div className="bg-destructive absolute top-0 right-0 bottom-0 flex w-18 items-center justify-center rounded-r-xl">
        <button
          onClick={() => onRemove(city.id)}
          className="flex flex-col items-center gap-0.5 px-3 text-white"
          aria-label={`Remove ${city.city}`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[10px]">Remove</span>
        </button>
      </div>

      {/* Card */}
      <div
        className="bg-card border-border relative flex items-center gap-3 rounded-xl border px-3 py-3 transition-transform"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <button
          className="text-muted-foreground flex-shrink-0 cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* City name */}
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{city.city}</p>
          <p className="text-muted-foreground text-xs">{city.country}</p>
        </div>

        {/* Day stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDaysChange(city.id, Math.max(1, city.days - 1))}
            className="border-border text-muted-foreground hover:bg-secondary flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
            aria-label="Decrease days"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums">{city.days}d</span>
          <button
            onClick={() => onDaysChange(city.id, city.days + 1)}
            className="border-border text-muted-foreground hover:bg-secondary flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
            aria-label="Increase days"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Desktop delete icon */}
        <button
          onClick={() => onRemove(city.id)}
          className="text-muted-foreground hover:text-destructive hidden flex-shrink-0 transition-colors sm:flex"
          aria-label={`Remove ${city.city}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
