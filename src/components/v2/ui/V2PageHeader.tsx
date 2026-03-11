"use client";

import type { ReactNode } from "react";

interface V2PageHeaderProps {
  title: string;
  description?: string;
  titleBadge?: ReactNode;
  action?: ReactNode;
}

export function V2PageHeader({
  title,
  description,
  titleBadge,
  action,
}: V2PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-8 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-v2-navy text-2xl font-bold">{title}</h1>
          {titleBadge}
        </div>
        {description && <p className="text-v2-text-muted mt-2 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
