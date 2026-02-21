"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Minus, Plus, X, Save } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Navbar } from "@/components/Navbar";
import { Button, BackLink, FormField } from "@/components/ui";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { useItinerary } from "@/hooks/useItinerary";
import { useTripStore } from "@/stores/useTripStore";

import { TripNotFound } from "@/components/trip/TripNotFound";
import { ServerErrorAlert } from "@/components/auth/ServerErrorAlert";
import { useSaveTripEdit } from "@/hooks/api";
import type { CityStop } from "@/types";
import type { CityEntry } from "@/data/cities";

type Params = Promise<{ id: string }>;

/* ── Sortable city card ───────────────────────────────────────────── */
function SortableCityCard({
  city, index, expandedCity, toggleExpanded, updateDays, removeCity,
}: {
  city: CityStop;
  index: number;
  expandedCity: string | null;
  toggleExpanded: (city: string) => void;
  updateDays: (cityId: string, delta: number) => void;
  removeCity: (cityId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div className="card-travel bg-background flex items-center gap-4 group">
        {/* Drag handle */}
        <div {...attributes} {...listeners} style={{ cursor: "grab" }} className="shrink-0 w-10 h-10 flex items-center justify-center touch-none">
          <GripVertical className="w-5 h-5 text-muted-foreground/50" />
        </div>

        <div className="flex-1 min-w-0">
          <button onClick={() => toggleExpanded(city.city)} className="w-full text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <span className="font-semibold text-foreground">{city.city}</span>
              <span className="text-muted-foreground text-sm">
                {city.country} · {city.days} day{city.days !== 1 ? "s" : ""}
              </span>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {expandedCity === city.city && (
              <motion.div
                key="expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border">
                  <FormField label="Number of days">
                    <div className="flex items-center gap-3">
                      <Button iconOnly size="sm" variant="ghost" onClick={() => updateDays(city.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-xl font-bold text-primary w-8 text-center">{city.days}</span>
                      <Button iconOnly size="sm" variant="ghost" onClick={() => updateDays(city.id, +1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </FormField>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => removeCity(city.id)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-accent sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent/10 transition-all shrink-0"
          aria-label={`Remove ${city.city}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Main edit page ───────────────────────────────────────────────── */
export default function EditPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();
  const itinerary = useItinerary();
  // Extract route early (before hooks) for safe hook dependencies
  const route = itinerary?.route ?? [];

  const setItinerary = useTripStore((s) => s.setItinerary);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);

  const saveMutation = useSaveTripEdit();

  const [cities, setCities] = useState<CityStop[]>(itinerary ? [...itinerary.route] : []);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [showAddCity, setShowAddCity] = useState(false);

  const updateDays = (cityId: string, delta: number) => {
    setCities((prev) =>
      prev.map((c) => c.id === cityId ? { ...c, days: Math.max(1, c.days + delta) } : c)
    );
  };

  const removeCity = (cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
    if (expandedCity === cityId) setExpandedCity(null);
  };

  const toggleExpanded = (city: string) => {
    setExpandedCity((prev) => (prev === city ? null : city));
  };

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCities((prev) => {
        const oldIdx = prev.findIndex((c) => c.id === active.id);
        const newIdx = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  // Detect what changed vs original
  const detectEditType = useCallback((): { editType: string; editPayload: object; description: string } => {
    const origIds = route.map((c) => c.id);
    const newIds = cities.map((c) => c.id);

    const added = newIds.filter((cid) => !origIds.includes(cid));
    const removed = origIds.filter((cid) => !newIds.includes(cid));
    const reordered = origIds.filter((cid) => newIds.includes(cid)).join(",") !== newIds.filter((cid) => origIds.includes(cid)).join(",");
    const daysChanged = cities.some((c) => {
      const orig = route.find((o) => o.id === c.id);
      return orig && orig.days !== c.days;
    });

    if (added.length > 0) {
      const addedCities = cities.filter((c) => added.includes(c.id));
      return {
        editType: "add_city",
        editPayload: { addedCities: addedCities.map((c) => ({ city: c.city, country: c.country, days: c.days })) },
        description: `Added ${addedCities.map((c) => c.city).join(", ")}`,
      };
    }
    if (removed.length > 0) {
      return {
        editType: "remove_city",
        editPayload: { removedCityIds: removed },
        description: `Removed ${removed.join(", ")} from route`,
      };
    }
    if (reordered) {
      return {
        editType: "reorder_cities",
        editPayload: { newOrder: newIds },
        description: "Reordered cities",
      };
    }
    if (daysChanged) {
      const changes = cities
        .filter((c) => {
          const orig = route.find((o) => o.id === c.id);
          return orig && orig.days !== c.days;
        })
        .map((c) => ({ cityId: c.id, city: c.city, newDays: c.days }));
      return {
        editType: "adjust_days",
        editPayload: { changes },
        description: changes.map((c) => `${c.city}: ${c.newDays} days`).join(", "),
      };
    }
    return { editType: "adjust_days", editPayload: {}, description: "No changes" };
  }, [cities, route]);

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound />;
  }

  const handleSave = async () => {
    const { editType, editPayload, description } = detectEditType();

    // Keep days for existing cities, filter out removed ones
    const existingDays = itinerary.days.filter((d) => cities.some((c) => c.city === d.city) || d.isTravel);

    const updatedData = {
      ...itinerary,
      route: cities,
      days: existingDays,
    };

    // Flag regeneration if cities were structurally changed (added/removed)
    if (editType === "add_city" || editType === "remove_city") {
      setNeedsRegeneration(true);
    }

    // Guest mode: no DB, update Zustand store directly
    if (id === "guest") {
      setItinerary(updatedData);
      router.push(`/trip/guest`);
      return;
    }

    // Fire mutation first — onMutate captures previous state synchronously
    saveMutation.mutate(
      { tripId: id, editType, editPayload, description, data: updatedData },
    );
    // Optimistic update + navigate immediately
    setItinerary(updatedData);
    router.push(`/trip/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      {/* Fixed top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackLink href={`/trip/${id}`} label="" />
            <h1 className="text-lg font-bold text-foreground">Edit Trip</h1>
            <span className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-2 py-0.5 rounded-full text-xs font-medium">
              Edit Mode
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[7.5rem] pb-32 max-w-3xl mx-auto px-4">

        <div className="border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-6">
          {cities.length === 1 ? (
            <>
              <h2 className="text-base font-semibold text-foreground mb-4">Trip Duration</h2>
              <div className="card-travel bg-background">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{cities[0].city}, {cities[0].country}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button iconOnly size="sm" variant="ghost" onClick={() => updateDays(cities[0].id, -1)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold text-primary w-8 text-center">{cities[0].days}</span>
                  <Button iconOnly size="sm" variant="ghost" onClick={() => updateDays(cities[0].id, +1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">days</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-foreground mb-4">Route Cities</h2>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cities.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {cities.map((city, i) => (
                      <SortableCityCard
                        key={city.id}
                        city={city}
                        index={i}
                        expandedCity={expandedCity}
                        toggleExpanded={toggleExpanded}
                        updateDays={updateDays}
                        removeCity={removeCity}
                      />
                    ))}

                    {showAddCity ? (
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
                    ) : (
                      <button
                        onClick={() => setShowAddCity(true)}
                        className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm font-medium">Add a city</span>
                      </button>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        <ServerErrorAlert error={saveMutation.error ? "Failed to save changes. Please try again." : null} />
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <Link href={`/trip/${id}`} className="btn-ghost text-sm py-2 px-4">
            Cancel
          </Link>
          <Button size="sm" loading={saveMutation.isPending} onClick={handleSave} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

    </div>
  );
}
