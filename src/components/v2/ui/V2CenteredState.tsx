"use client";

import type { ReactNode } from "react";

interface V2CenteredStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "error";
}

export function V2CenteredState({
  title,
  description,
  action,
  tone = "default",
}: V2CenteredStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      {title ? (
        <p className={tone === "error" ? "text-v2-red text-sm" : "text-v2-navy text-lg font-bold"}>
          {title}
        </p>
      ) : null}
      {description ? <p className="text-v2-text-muted mt-1 text-sm">{description}</p> : null}
      {action}
    </div>
  );
}
