"use client";

import { X } from "lucide-react";
import type { Toast as ToastType } from "@/stores/useToastStore";

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed right-4 bottom-6 left-4 z-100 flex flex-col gap-2 sm:right-6 sm:left-auto">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-animate ${t.exiting ? "toast-exit" : "toast-enter"} flex max-w-sm min-w-[280px] items-start gap-3 rounded-xl px-4 py-3 shadow-[var(--shadow-card-hover)] ${
            t.variant === "error"
              ? "border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40"
              : "bg-card border-border border"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-muted-foreground mt-0.5 text-xs">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
