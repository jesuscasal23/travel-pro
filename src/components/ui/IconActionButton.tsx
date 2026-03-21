"use client";

import type { ReactNode } from "react";

interface IconActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  badge?: ReactNode;
}

export function IconActionButton({ icon, onClick, badge }: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-navy relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110"
    >
      {icon}
      {badge ? <span className="absolute -top-1 -right-1">{badge}</span> : null}
    </button>
  );
}
