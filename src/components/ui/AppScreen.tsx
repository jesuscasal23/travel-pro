"use client";

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppScreenProps {
  children: ReactNode;
}

export function AppScreen({ children }: AppScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
