"use client";

import { useMemo } from "react";
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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEditStore, type EditableActivity, type EditItinerary } from "@/stores/useEditStore";
import { EditableActivityCard } from "./EditableActivityCard";
import { AddActivityButton } from "./AddActivityButton";
import { DayDropZone } from "./DayDropZone";
import { DayPills } from "../DayPills";
import { CityHeader } from "../CityHeader";
import { groupDaysByCity } from "@/lib/utils/group-days-by-city";
import type { CityWeather } from "@/types";

interface EditModeJourneyContentProps {
  draft: EditItinerary;
  activeDayMap: Record<number, number>;
  onDayChange: (groupIdx: number, dayNum: number) => void;
  generatingCityId: string | null;
  onGenerateActivities: (cityId: string, cityName: string) => void;
}

export function EditModeJourneyContent({
  draft,
  activeDayMap,
  onDayChange,
  generatingCityId,
  onGenerateActivities,
}: EditModeJourneyContentProps) {
  const { updateDraft, expandedActivityId, setExpandedActivityId } = useEditStore();

  const cityGroups = useMemo(
    () => groupDaysByCity(draft.days, draft.route),
    [draft.days, draft.route]
  );

  // Memoize weather map
  const weatherMap = useMemo(() => {
    const m = new Map<string, CityWeather>();
    draft.weatherData?.forEach((w) => m.set(w.city, w));
    return m;
  }, [draft.weatherData]);

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

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which day the dragged activity lives in
    updateDraft((d) => {
      const newDays = d.days.map((day) => {
        const actIds = day.activities.map((a) => a._editId);
        const activeIdx = actIds.indexOf(activeId);
        if (activeIdx === -1) return day;

        // Check if dropped onto a day droppable (cross-day within same city)
        // Day droppable ids are formatted as "day-{day.day}"
        const targetDayNum = parseDayDroppableId(overId);
        if (targetDayNum !== null) {
          // Cross-day move: only allow if target day is in same city
          const targetDayObj = d.days.find((dd) => dd.day === targetDayNum);
          if (!targetDayObj || targetDayObj.city !== day.city) return day;
          // Remove from source day
          const [moved] = day.activities.splice(activeIdx, 1);
          return { ...day, activities: [...day.activities.filter((a) => a._editId !== activeId)] };
        }

        // Same-day reorder
        const overIdx = actIds.indexOf(overId);
        if (overIdx === -1) return day;
        return { ...day, activities: arrayMove(day.activities, activeIdx, overIdx) };
      });

      // Handle cross-day insert: find target day and insert the activity
      const activeActivity = d.days
        .flatMap((dd) => dd.activities)
        .find((a) => a._editId === activeId);

      const targetDayNum = parseDayDroppableId(overId);
      if (targetDayNum !== null && activeActivity) {
        return {
          ...d,
          days: newDays.map((day) => {
            if (day.day === targetDayNum) {
              return { ...day, activities: [...day.activities, activeActivity] };
            }
            return day;
          }),
        };
      }

      return { ...d, days: newDays };
    });
  }

  function handleActivityChange(dayNum: number, updated: EditableActivity) {
    updateDraft((d) => ({
      ...d,
      days: d.days.map((day) =>
        day.day !== dayNum
          ? day
          : {
              ...day,
              activities: day.activities.map((a) => (a._editId === updated._editId ? updated : a)),
            }
      ),
    }));
  }

  function handleDeleteActivity(dayNum: number, editId: string) {
    setExpandedActivityId(null);
    updateDraft((d) => ({
      ...d,
      days: d.days.map((day) =>
        day.day !== dayNum
          ? day
          : { ...day, activities: day.activities.filter((a) => a._editId !== editId) }
      ),
    }));
  }

  function handleAddManual(dayNum: number) {
    const newAct: EditableActivity = {
      _editId: crypto.randomUUID(),
      name: "",
      category: "General",
      why: "",
      duration: "",
    };
    updateDraft((d) => ({
      ...d,
      days: d.days.map((day) =>
        day.day === dayNum ? { ...day, activities: [...day.activities, newAct] } : day
      ),
    }));
    // Auto-expand the new activity
    setExpandedActivityId(newAct._editId);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {cityGroups.map((group, groupIdx) => {
        const cityStop = draft.route.find((r) => r.city === group.city) ?? draft.route[0];
        const weather = weatherMap.get(group.city);
        const activeDayNum = activeDayMap[groupIdx] ?? group.days[0]?.day;
        // Look up from draft.days so activities are typed as EditableActivity[]
        const activeDay =
          draft.days.find((d) => d.day === activeDayNum) ??
          draft.days.find((d) => d.day === group.days[0]?.day);
        const isGeneratingThis = generatingCityId === cityStop.id;

        return (
          <div key={group.cityId + groupIdx} className="mb-6 px-4">
            <CityHeader city={cityStop} weather={weather} variant="mobile" />

            <DayPills
              days={group.days}
              activeDay={activeDayNum}
              onDayClick={(dayNum) => onDayChange(groupIdx, dayNum)}
            />

            {activeDay && (
              <>
                {/* Travel banner */}
                {activeDay.isTravel && activeDay.travelFrom && activeDay.travelTo && (
                  <div className="text-muted-foreground bg-secondary mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                    <span className="text-primary">✈️</span>
                    <span>
                      {activeDay.travelFrom} → {activeDay.travelTo}
                    </span>
                  </div>
                )}

                <DayDropZone dayId={`day-${activeDay.day}`} activities={activeDay.activities}>
                  {activeDay.activities.length === 0 ? (
                    <div className="text-muted-foreground border-border rounded-xl border border-dashed py-4 text-center text-xs">
                      No activities yet — add one below
                    </div>
                  ) : (
                    activeDay.activities.map((activity, i) => (
                      <EditableActivityCard
                        key={activity._editId}
                        activity={activity}
                        isExpanded={expandedActivityId === activity._editId}
                        onToggleExpand={() =>
                          setExpandedActivityId(
                            expandedActivityId === activity._editId ? null : activity._editId
                          )
                        }
                        onChange={(updated) => handleActivityChange(activeDay.day, updated)}
                        onDelete={() => handleDeleteActivity(activeDay.day, activity._editId)}
                        isFirst={i === 0}
                        isLast={i === activeDay.activities.length - 1}
                      />
                    ))
                  )}
                </DayDropZone>

                <AddActivityButton
                  onAddManual={() => handleAddManual(activeDay.day)}
                  onAddAI={() => onGenerateActivities(cityStop.id, cityStop.city)}
                  isGeneratingAI={isGeneratingThis}
                />
              </>
            )}
          </div>
        );
      })}
    </DndContext>
  );
}

/** Parse "day-{n}" droppable ids, return the day number or null */
function parseDayDroppableId(id: string): number | null {
  const match = id.match(/^day-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
