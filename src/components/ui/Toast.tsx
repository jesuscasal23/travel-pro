"use client";

import { X } from "lucide-react";
import type { Toast as ToastType } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-100 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-animate ${t.exiting ? "toast-exit" : "toast-enter"} rounded-xl shadow-[var(--shadow-card-hover)] px-4 py-3 min-w-[280px] max-w-sm flex items-start gap-3 ${
            t.variant === "error"
              ? "bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900/50"
              : "bg-card border border-border"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
            {t.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
