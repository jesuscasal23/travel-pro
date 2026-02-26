"use client";

import { useState } from "react";
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

export function EditRouteSheet({ cities, onCitiesChange, onClose, variant }: EditRouteSheetProps) {
  const [comboboxValue, setComboboxValue] = useState("");

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    setComboboxValue("");
  }

  const inner = (
    <>
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="bg-border absolute top-2 left-1/2 mx-auto h-1 w-8 -translate-x-1/2 rounded-full sm:hidden" />
        <h3 className="text-foreground text-sm font-semibold">Edit Route</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Sortable city list */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
          <p className="text-muted-foreground mb-1.5 text-xs">Add a city</p>
          <CityCombobox value={comboboxValue} onChange={handleAddCity} placeholder="Search city…" />
        </div>
      </div>

      {/* Done button */}
      <div className="border-border border-t px-4 py-3">
        <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm">
          Done
        </button>
      </div>
    </>
  );

  if (variant === "desktop") {
    // Inline panel that slides down below the hero
    return (
      <div className="mx-auto max-w-[960px] px-4 py-4">
        <div className="border-border bg-card flex max-h-[520px] flex-col overflow-hidden rounded-2xl border">
          {inner}
        </div>
      </div>
    );
  }

  // Mobile: bottom sheet with overlay
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden />
      {/* Sheet */}
      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl shadow-xl">
        {/* Drag indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="bg-border h-1 w-10 rounded-full" />
        </div>
        {inner}
      </div>
    </>
  );
}
