"use client";

import { Undo2 } from "lucide-react";

interface EditToolbarProps {
  canUndo: boolean;
  hasChanges: boolean;
  onUndo: () => void;
  onDiscard: () => void;
  onSave: () => void;
  /** Desktop variant floats at bottom-right; mobile replaces bottom nav */
  variant: "mobile" | "desktop";
}

export function EditToolbar({
  canUndo,
  hasChanges,
  onUndo,
  onDiscard,
  onSave,
  variant,
}: EditToolbarProps) {
  if (variant === "mobile") {
    return (
      <nav className="bg-background/95 border-border fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur-lg">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="text-muted-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onDiscard} className="btn-ghost px-4 py-2 text-sm">
              Discard
            </button>
            <button onClick={onSave} className="btn-primary px-4 py-2 text-sm">
              Save
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop: floating bottom-right
  return (
    <div className="bg-background border-border fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="text-muted-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
      >
        <Undo2 className="h-4 w-4" />
        Undo
      </button>
      <div className="bg-border h-5 w-px" />
      <button onClick={onDiscard} className="btn-ghost px-3 py-1.5 text-sm">
        Discard
      </button>
      <button onClick={onSave} className="btn-primary px-4 py-1.5 text-sm">
        Save
      </button>
    </div>
  );
}
