"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, GripVertical, Minus, Plus, X, Save, Loader2, History } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Dialog from "@radix-ui/react-dialog";
import { X as Close } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";
import { useTripStore } from "@/stores/useTripStore";
import type { CityStop } from "@/types";

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
        <div {...attributes} {...listeners} style={{ cursor: "grab" }} className="shrink-0">
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

          {expandedCity === city.city && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Number of days
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateDays(city.id, -1)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-bold text-primary w-8 text-center">{city.days}</span>
                  <button onClick={() => updateDays(city.id, +1)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <button onClick={() => removeCity(city.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 hover:bg-accent/10 transition-all shrink-0"
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

  const setItinerary = useTripStore((s) => s.setItinerary);

  const [cities, setCities] = useState<CityStop[]>([...itinerary.route]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
    const origIds = itinerary.route.map((c) => c.id);
    const newIds = cities.map((c) => c.id);

    const removed = origIds.filter((id) => !newIds.includes(id));
    const reordered = origIds.join(",") !== newIds.join(",") && removed.length === 0;
    const daysChanged = cities.some((c) => {
      const orig = itinerary.route.find((o) => o.id === c.id);
      return orig && orig.days !== c.days;
    });

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
          const orig = itinerary.route.find((o) => o.id === c.id);
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
  }, [cities, itinerary.route]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const { editType, editPayload, description } = detectEditType();

    // Recalculate budget proportionally based on day changes
    const totalDays = cities.reduce((s, c) => s + c.days, 0);
    const origTotalDays = itinerary.route.reduce((s, c) => s + c.days, 0);
    const ratio = origTotalDays > 0 ? totalDays / origTotalDays : 1;

    const updatedData = {
      ...itinerary,
      route: cities,
      budget: {
        ...itinerary.budget,
        accommodation: Math.round(itinerary.budget.accommodation * ratio),
        transport: Math.round(itinerary.budget.transport * ratio),
        food: Math.round(itinerary.budget.food * ratio),
        total: Math.round(
          itinerary.budget.flights +
          itinerary.budget.accommodation * ratio +
          itinerary.budget.activities +
          itinerary.budget.food * ratio +
          itinerary.budget.transport * ratio
        ),
      },
      days: itinerary.days.filter((d) => cities.some((c) => c.city === d.city) || d.isTravel),
    };

    // Guest mode: no DB, update Zustand store directly
    if (id === "guest") {
      setItinerary(updatedData);
      router.push(`/trip/guest`);
      return;
    }

    try {
      const res = await fetch(`/api/v1/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editType, editPayload, description, data: updatedData }),
      });

      if (!res.ok) throw new Error("Save failed");

      router.push(`/trip/${id}`);
    } catch (err) {
      setSaveError("Failed to save changes. Please try again.");
      setIsSaving(false);
    }
  };

  const budgetWithUpdated = {
    ...itinerary.budget,
    accommodation: Math.round(
      itinerary.budget.accommodation *
      (cities.reduce((s, c) => s + c.days, 0) /
        Math.max(1, itinerary.route.reduce((s, c) => s + c.days, 0)))
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      {/* Fixed top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trip/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">Edit Trip</h1>
            <span className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-2 py-0.5 rounded-full text-xs font-medium">
              Edit Mode
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            Version history
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[7.5rem] pb-32 max-w-3xl mx-auto px-4">

        <div className="border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-6">
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

                <button className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Plus className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">Add a city</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Budget Impact Panel */}
        <div className="mt-8 card-travel bg-background">
          <h3 className="font-semibold text-foreground mb-4">Budget Impact</h3>
          <div className="space-y-2">
            {(Object.entries(itinerary.budget) as [string, number][])
              .filter(([k]) => k !== "total" && k !== "budget")
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="font-medium text-accent">€{v.toLocaleString()}</span>
                </div>
              ))}
          </div>
          <div className="pt-3 mt-2 border-t border-border flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-accent">€{itinerary.budget.total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Accommodation and transport will be recalculated proportionally when you save.
          </p>
        </div>

        {saveError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <Link href={`/trip/${id}`} className="btn-ghost text-sm py-2 px-4">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog.Root open={historyOpen} onOpenChange={setHistoryOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-background rounded-2xl shadow-xl border border-border">
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-foreground">Version History</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-muted-foreground hover:text-foreground"><Close className="w-5 h-5" /></button>
              </Dialog.Close>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">v1 — Original</p>
                  <p className="text-xs text-muted-foreground">AI-generated itinerary</p>
                </div>
                <span className="badge-success text-xs">Current</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Future edits will appear here. You can restore any previous version.
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
