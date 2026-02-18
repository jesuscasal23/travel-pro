"use client";

export function ServerErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    </div>
  );
}
