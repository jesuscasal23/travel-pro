import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Your Trip",
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
