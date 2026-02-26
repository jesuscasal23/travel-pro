"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onOpenChange, title, children, maxWidth = "max-w-md" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 ${maxWidth} bg-background border-border data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-xl sm:p-6`}
        >
          <div className="mb-4 flex items-start justify-between">
            <Dialog.Title className="text-foreground text-lg font-bold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground hover:bg-muted -mt-2 -mr-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
