"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label="Go back"
      className="hover:text-navy text-back-btn shadow-back-btn flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm transition-colors"
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}
