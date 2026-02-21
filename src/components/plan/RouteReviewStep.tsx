"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Minus, Plus, X, Sparkles, AlertTriangle } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui";
import { CityCombobox } from "@/components/ui/CityCombobox";
import type { CityStop } from "@/types";
import type { CityEntry } from "@/data/cities";

/* ── Sortable city card ───────────────────────────────────────────── */

function SortableCityCard({
  city, index, updateDays, removeCity, canRemove,
}: {
  city: CityStop;
  index: number;
  updateDays: (cityId: string, delta: number) => void;
  removeCity: (cityId: string) => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div className="card-travel bg-background flex items-center gap-3 group">
        <div {...attributes} {...listeners} style={{ cursor: "grab" }} className="shrink-0 w-8 h-8 flex items-center justify-center touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>

        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm">{city.city}</div>
          <div className="text-muted-foreground text-xs">{city.country}</div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => updateDays(city.id, -1)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Decrease days"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold text-primary w-12 text-center">
            {city.days} day{city.days !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => updateDays(city.id, 1)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Increase days"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {canRemove && (
          <button
            onClick={() => removeCity(city.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-accent sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent/10 transition-all shrink-0"
            aria-label={`Remove ${city.city}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────── */

function RouteSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-travel bg-background flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="w-6 h-6 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded mb-1" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */

interface RouteReviewStepProps {
  cities: CityStop[];
  tripDuration: number;
  onConfirm: (cities: CityStop[]) => void;
  isLoading: boolean;
}

export function RouteReviewStep({
  cities: initialCities,
  tripDuration,
  onConfirm,
  isLoading,
}: RouteReviewStepProps) {
  const [cities, setCities] = useState<CityStop[]>(initialCities);
  const [showAddCity, setShowAddCity] = useState(false);

  // Sync if initialCities changes (e.g., from loading → loaded)
  const [prevInitial, setPrevInitial] = useState(initialCities);
  if (initialCities !== prevInitial && initialCities.length > 0 && cities.length === 0) {
    setCities(initialCities);
    setPrevInitial(initialCities);
  }

  const totalDays = cities.reduce((s, c) => s + c.days, 0);
  const overBudget = totalDays > tripDuration;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCities((prev) => {
        const oldIdx = prev.findIndex((c) => c.id === active.id);
        const newIdx = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const updateDays = useCallback((cityId: string, delta: number) => {
    setCities((prev) =>
      prev.map((c) => c.id === cityId ? { ...c, days: Math.max(1, c.days + delta) } : c)
    );
  }, []);

  const removeCity = useCallback((cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
  }, []);

  const addCity = useCallback((entry: CityEntry) => {
    const isDuplicate = cities.some(
      (c) => c.city === entry.city && c.countryCode === entry.countryCode
    );
    if (isDuplicate) return;

    const newCity: CityStop = {
      id: crypto.randomUUID(),
      city: entry.city,
      country: entry.country,
      countryCode: entry.countryCode,
      lat: entry.lat,
      lng: entry.lng,
      days: 3,
    };
    setCities((prev) => [...prev, newCity]);
    setShowAddCity(false);
  }, [cities]);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Review your route</h2>
        <p className="text-muted-foreground text-sm mb-6">Our AI is selecting the best cities for your trip...</p>
        <RouteSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">Review your route</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Add, remove, or reorder cities. Drag to change the order.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cities.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {cities.map((city, i) => (
              <SortableCityCard
                key={city.id}
                city={city}
                index={i}
                updateDays={updateDays}
                removeCity={removeCity}
                canRemove={cities.length > 2}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add city */}
      <div className="mt-3">
        <AnimatePresence mode="wait">
          {showAddCity ? (
            <motion.div
              key="combobox"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card-travel bg-background p-4">
                <div className="text-sm font-medium text-foreground mb-2">Search for a city</div>
                <CityCombobox
                  value=""
                  onChange={addCity}
                  placeholder="Type a city name..."
                />
                <button
                  onClick={() => setShowAddCity(false)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddCity(true)}
              className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-0.5" />
              <span className="text-sm font-medium">Add a city</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Summary bar */}
      <div className={`mt-6 rounded-xl p-4 flex items-center justify-between ${
        overBudget ? "bg-accent/10 border border-accent/20" : "bg-primary/5"
      }`}>
        <div className="flex items-center gap-2">
          {overBudget && <AlertTriangle className="w-4 h-4 text-accent shrink-0" />}
          <span className="text-sm text-foreground">
            <span className="font-bold">{totalDays} days</span> across{" "}
            <span className="font-bold">{cities.length} cities</span>
          </span>
        </div>
        <span className={`text-sm ${overBudget ? "text-accent font-medium" : "text-muted-foreground"}`}>
          Trip: {tripDuration} days
        </span>
      </div>
      {overBudget && (
        <p className="text-xs text-muted-foreground mt-2">
          Days will be adjusted automatically to fit your trip duration.
        </p>
      )}

      {/* Generate button */}
      <div className="mt-8">
        <Button
          onClick={() => {
            // Auto-normalize days to fit trip duration
            let finalCities = cities;
            const total = cities.reduce((s, c) => s + c.days, 0);
            if (tripDuration > 0 && total > tripDuration) {
              const scale = tripDuration / total;
              let remaining = tripDuration;
              finalCities = cities.map((c, i) => {
                if (i === cities.length - 1) {
                  return { ...c, days: Math.max(1, remaining) };
                }
                const scaled = Math.max(1, Math.round(c.days * scale));
                remaining -= scaled;
                return { ...c, days: scaled };
              });
            }
            onConfirm(finalCities);
          }}
          disabled={cities.length < 2}
          className="w-full gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate My Itinerary
        </Button>
        {cities.length < 2 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            A multi-city trip needs at least 2 cities.
          </p>
        )}
      </div>
    </div>
  );
}
