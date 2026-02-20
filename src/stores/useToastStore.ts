import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "error";
  exiting?: boolean;
}

interface ToastState {
  toasts: Toast[];
  toast: (incoming: Omit<Toast, "id" | "exiting">) => void;
  dismiss: (id: string) => void;
}

const EXIT_DURATION = 200;

function removeToast(id: string) {
  useToastStore.setState((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  }));
}

function startExit(id: string) {
  useToastStore.setState((state) => ({
    toasts: state.toasts.map((t) =>
      t.id === id ? { ...t, exiting: true } : t,
    ),
  }));
  setTimeout(() => removeToast(id), EXIT_DURATION);
}

export const useToastStore = create<ToastState>(() => ({
  toasts: [],
  toast: (incoming) => {
    const id = crypto.randomUUID();
    useToastStore.setState((state) => ({
      toasts: [...state.toasts, { ...incoming, id }],
    }));
    setTimeout(() => startExit(id), 4000);
  },
  dismiss: (id) => startExit(id),
}));
