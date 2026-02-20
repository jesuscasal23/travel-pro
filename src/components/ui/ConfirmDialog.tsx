"use client";

import { type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  items?: string[];
  /** Warning line shown in bold below the list. */
  warning?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  warning,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {items && items.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1 mb-6 ml-4">
          {items.map((item) => (
            <li key={item}>&bull; {item}</li>
          ))}
        </ul>
      )}
      {warning && (
        <p className="text-sm font-medium text-foreground mb-6">{warning}</p>
      )}
      {children}
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          className="flex-1"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
