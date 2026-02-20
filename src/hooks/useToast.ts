"use client";

import { useToastStore } from "@/stores/useToastStore";

export type { Toast } from "@/stores/useToastStore";

export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);
  return { toasts, toast, dismiss };
}
