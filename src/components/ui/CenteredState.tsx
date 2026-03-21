"use client";

import type { ReactNode } from "react";

interface CenteredStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "error";
}

export function CenteredState({
  title,
  description,
  action,
  tone = "default",
}: CenteredStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      {title ? (
        <p className={tone === "error" ? "text-app-red text-sm" : "text-navy text-lg font-bold"}>
          {title}
        </p>
      ) : null}
      {description ? <p className="text-dim mt-1 text-sm">{description}</p> : null}
      {action}
    </div>
  );
}
