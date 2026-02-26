"use client";

import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`border-border rounded-2xl border-2 border-dashed py-16 text-center ${className}`}
    >
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mb-6 text-sm">{description}</p>}
      {action}
    </div>
  );
}
