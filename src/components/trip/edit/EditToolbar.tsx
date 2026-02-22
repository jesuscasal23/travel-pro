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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-between px-4 h-14 gap-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-40 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onDiscard}
              className="btn-ghost text-sm py-2 px-4"
            >
              Discard
            </button>
            <button
              onClick={onSave}
              className="btn-primary text-sm py-2 px-4"
            >
              Save
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop: floating bottom-right
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-background border border-border rounded-xl shadow-lg px-4 py-3">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-40 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
      >
        <Undo2 className="w-4 h-4" />
        Undo
      </button>
      <div className="w-px h-5 bg-border" />
      <button
        onClick={onDiscard}
        className="btn-ghost text-sm py-1.5 px-3"
      >
        Discard
      </button>
      <button
        onClick={onSave}
        className="btn-primary text-sm py-1.5 px-4"
      >
        Save
      </button>
    </div>
  );
}
