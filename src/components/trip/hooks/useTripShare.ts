"use client";

import { useState } from "react";
import { useShareTrip } from "@/hooks/api";

export function useTripShare(tripId: string, isAuthenticated: boolean | null) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareMutation = useShareTrip();

  async function handleShareClick() {
    setShareModalOpen(true);

    if (tripId === "guest" || isAuthenticated === false) {
      setShareUrl(`${window.location.origin}/trips/${tripId}`);
      return;
    }

    if (shareUrl) return;

    try {
      const data = await shareMutation.mutateAsync(tripId);
      if (data.shareToken) {
        setShareUrl(`${window.location.origin}/share/${data.shareToken}`);
      }
    } catch {
      // Keep modal open — user can close and retry
    }
  }

  return {
    shareModalOpen,
    setShareModalOpen,
    shareUrl,
    handleShareClick,
    isSharePending: shareMutation.isPending,
  };
}
