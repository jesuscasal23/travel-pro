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

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${maxWidth} max-w-[calc(100vw-2rem)] p-4 sm:p-6 bg-background rounded-2xl shadow-xl border border-border data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out`}
        >
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="w-10 h-10 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
