import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Plan Your Dream Trip in Minutes",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar isAuthenticated={false} />
      {children}
    </>
  );
}
