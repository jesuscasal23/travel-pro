"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EditableActivity } from "@/stores/useEditStore";

interface DayDropZoneProps {
  dayId: string; // unique key used as droppable id
  activities: EditableActivity[];
  children: React.ReactNode;
}

export function DayDropZone({ dayId, activities, children }: DayDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dayId });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-colors ${isOver ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
    >
      <SortableContext
        items={activities.map((a) => a._editId)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </div>
  );
}
