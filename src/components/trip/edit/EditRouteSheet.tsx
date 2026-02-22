"use client";

import { useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { X } from "lucide-react";
import { SortableCityCard } from "./SortableCityCard";
import { CityCombobox } from "@/components/ui/CityCombobox";
import type { CityStop } from "@/types";
import type { CityEntry } from "@/data/cities";

interface EditRouteSheetProps {
  cities: CityStop[];
  onCitiesChange: (cities: CityStop[]) => void;
  onClose: () => void;
  /** Desktop variant renders inline (no overlay); mobile renders as bottom sheet */
  variant: "mobile" | "desktop";
}

export function EditRouteSheet({
  cities,
  onCitiesChange,
  onClose,
  variant,
}: EditRouteSheetProps) {
  const comboboxValue = useRef("");

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cities.findIndex((c) => c.id === active.id);
    const newIndex = cities.findIndex((c) => c.id === over.id);
    onCitiesChange(arrayMove(cities, oldIndex, newIndex));
  }

  function handleDaysChange(cityId: string, newDays: number) {
    onCitiesChange(cities.map((c) => (c.id === cityId ? { ...c, days: newDays } : c)));
  }

  function handleRemove(cityId: string) {
    onCitiesChange(cities.filter((c) => c.id !== cityId));
  }

  function handleAddCity(entry: CityEntry) {
    const newCity: CityStop = {
      id: crypto.randomUUID(),
      city: entry.city,
      country: entry.country,
      countryCode: entry.countryCode,
      lat: entry.lat,
      lng: entry.lng,
      days: 3,
    };
    onCitiesChange([...cities, newCity]);
    comboboxValue.current = "";
  }

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="w-8 h-1 bg-border rounded-full mx-auto sm:hidden absolute left-1/2 -translate-x-1/2 top-2" />
        <h3 className="font-semibold text-sm text-foreground">Edit Route</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sortable city list */}
      <div className="px-4 py-3 space-y-2 overflow-y-auto flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cities.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cities.map((city) => (
              <SortableCityCard
                key={city.id}
                city={city}
                onDaysChange={handleDaysChange}
                onRemove={handleRemove}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add city combobox */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1.5">Add a city</p>
          <CityCombobox
            value={comboboxValue.current}
            onChange={handleAddCity}
            placeholder="Search city…"
          />
        </div>
      </div>

      {/* Done button */}
      <div className="px-4 py-3 border-t border-border">
        <button onClick={onClose} className="btn-primary w-full text-sm py-2.5">
          Done
        </button>
      </div>
    </>
  );

  if (variant === "desktop") {
    // Inline panel that slides down below the hero
    return (
      <div className="max-w-[960px] mx-auto px-4 py-4">
        <div className="border border-border rounded-2xl bg-card overflow-hidden flex flex-col max-h-[520px]">
          {inner}
        </div>
      </div>
    );
  }

  // Mobile: bottom sheet with overlay
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl flex flex-col max-h-[80vh]">
        {/* Drag indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        {inner}
      </div>
    </>
  );
}
