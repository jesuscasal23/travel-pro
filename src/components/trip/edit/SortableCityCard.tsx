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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

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
      <div className="absolute right-0 top-0 bottom-0 w-18 flex items-center justify-center bg-destructive rounded-r-xl">
        <button
          onClick={() => onRemove(city.id)}
          className="flex flex-col items-center gap-0.5 px-3 text-white"
          aria-label={`Remove ${city.city}`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[10px]">Remove</span>
        </button>
      </div>

      {/* Card */}
      <div
        className="relative flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 transition-transform"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <button
          className="flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* City name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{city.city}</p>
          <p className="text-xs text-muted-foreground">{city.country}</p>
        </div>

        {/* Day stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDaysChange(city.id, Math.max(1, city.days - 1))}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Decrease days"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-medium w-12 text-center tabular-nums">
            {city.days}d
          </span>
          <button
            onClick={() => onDaysChange(city.id, city.days + 1)}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Increase days"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop delete icon */}
        <button
          onClick={() => onRemove(city.id)}
          className="hidden sm:flex flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          aria-label={`Remove ${city.city}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
