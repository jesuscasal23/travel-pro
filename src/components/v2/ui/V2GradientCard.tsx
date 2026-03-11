"use client";

import type { ReactNode } from "react";

interface V2GradientCardProps {
  gradient: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function V2GradientCard({
  gradient,
  children,
  className = "h-56",
  onClick,
}: V2GradientCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="absolute right-0 bottom-0 left-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      {children}
    </div>
  );
}
