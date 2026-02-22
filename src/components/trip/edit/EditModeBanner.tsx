"use client";

export function EditModeBanner() {
  return (
    <div className="sticky top-0 z-30 bg-sky-500/10 border-b border-sky-500/30 px-4 py-2">
      <p className="text-xs font-medium text-sky-700 dark:text-sky-400 text-center">
        Editing · Drag to reorder, tap to edit
      </p>
    </div>
  );
}
