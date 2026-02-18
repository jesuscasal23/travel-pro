"use client";

import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`card-travel ${
        hoverable
          ? "hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
