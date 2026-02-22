"use client";

import { useState, useRef } from "react";
import type { EditableActivity } from "@/stores/useEditStore";

interface InlineActivityFormProps {
  activity: EditableActivity;
  onChange: (updated: EditableActivity) => void;
  onDone: () => void;
}

export function InlineActivityForm({ activity, onChange, onDone }: InlineActivityFormProps) {
  // Local draft — committed on blur to keep undo stack clean
  const [local, setLocal] = useState(activity);
  const lastCommitted = useRef(activity);

  function commit(field: keyof EditableActivity, value: string) {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    if (value !== (lastCommitted.current[field] ?? "")) {
      lastCommitted.current = updated;
      onChange(updated);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="px-3 py-3 space-y-2.5 border-t border-border/60 bg-muted/30">
      {/* Name */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Name *</label>
        <input
          type="text"
          className={fieldClass}
          defaultValue={local.name}
          onBlur={(e) => commit("name", e.target.value)}
          placeholder="Activity name"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Duration *</label>
        <input
          type="text"
          className={fieldClass}
          defaultValue={local.duration}
          onBlur={(e) => commit("duration", e.target.value)}
          placeholder="e.g. 2 hours"
        />
      </div>

      {/* Cost */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Cost</label>
        <input
          type="text"
          className={fieldClass}
          defaultValue={local.cost ?? ""}
          onBlur={(e) => commit("cost", e.target.value)}
          placeholder="e.g. ¥500 or Free"
        />
      </div>

      {/* Why */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Why</label>
        <textarea
          className={`${fieldClass} resize-none`}
          rows={2}
          defaultValue={local.why}
          onBlur={(e) => commit("why", e.target.value)}
          placeholder="Why this activity?"
        />
      </div>

      {/* Food tip */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Food tip</label>
        <input
          type="text"
          className={fieldClass}
          defaultValue={local.food ?? ""}
          onBlur={(e) => commit("food", e.target.value)}
          placeholder="Optional food recommendation"
        />
      </div>

      {/* Pro tip */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pro tip</label>
        <input
          type="text"
          className={fieldClass}
          defaultValue={local.tip ?? ""}
          onBlur={(e) => commit("tip", e.target.value)}
          placeholder="Optional travel tip"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onDone}
          className="btn-primary text-sm py-1.5 px-4"
        >
          Done
        </button>
      </div>
    </div>
  );
}
