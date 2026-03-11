"use client";

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface V2ScreenProps {
  children: ReactNode;
}

export function V2Screen({ children }: V2ScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
