"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  mobileSheet?: boolean;
  contentClassName?: string;
  /** When true, only the close button dismisses the modal (not overlay click or Escape). */
  requireExplicitDismiss?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  maxWidth = "max-w-md",
  mobileSheet = false,
  contentClassName = "",
  requireExplicitDismiss = false,
}: ModalProps) {
  const blockClose = requireExplicitDismiss
    ? {
        onPointerDownOutside: (e: Event) => e.preventDefault(),
        onEscapeKeyDown: (e: Event) => e.preventDefault(),
      }
    : {};
  const animationClass = mobileSheet
    ? "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out sm:data-[state=open]:animate-modal-in sm:data-[state=closed]:animate-modal-out"
    : "data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out fixed inset-0 z-50 bg-[rgba(9,19,39,0.52)] backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          {...blockClose}
          className={`${animationClass} shadow-glass-2xl fixed z-50 w-full border border-white/70 bg-white/92 p-4 backdrop-blur-xl sm:p-6 ${
            mobileSheet
              ? `right-0 bottom-0 left-0 rounded-t-[30px] rounded-b-none border-b-0 max-sm:max-w-none ${maxWidth} sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[30px] sm:border-b`
              : `top-1/2 left-1/2 ${maxWidth} max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl`
          } ${contentClassName}`}
        >
          <div className="mb-4 flex items-start justify-between">
            <Dialog.Title className="text-heading text-lg font-bold tracking-[-0.03em]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="hover:bg-brand-primary-soft hover:text-steel text-meta -mt-2 -mr-2 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200"
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
