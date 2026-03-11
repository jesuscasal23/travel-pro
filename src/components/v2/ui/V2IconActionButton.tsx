"use client";

import type { ReactNode } from "react";

interface V2IconActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  badge?: ReactNode;
}

export function V2IconActionButton({ icon, onClick, badge }: V2IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-v2-navy relative flex h-10 w-10 items-center justify-center rounded-full"
    >
      {icon}
      {badge ? <span className="absolute -top-1 -right-1">{badge}</span> : null}
    </button>
  );
}
