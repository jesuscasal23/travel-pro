"use client";

export function ServerErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    </div>
  );
}
