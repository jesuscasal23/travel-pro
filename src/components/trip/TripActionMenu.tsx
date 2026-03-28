"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Share2, Trash2 } from "lucide-react";
import { useDeleteTrip } from "@/hooks/api";

interface TripActionMenuProps {
  tripId: string;
  tripName: string;
}

export function TripActionMenu({ tripId, tripName }: TripActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const deleteTrip = useDeleteTrip();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    function handleScroll() {
      close();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, close]);

  const renderPopover = () => {
    if (!open || !triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const container = document.getElementById("app-container");
    if (!container) return null;
    const containerRect = container.getBoundingClientRect();

    return createPortal(
      <div
        ref={menuRef}
        className="dark:bg-card fixed z-50 min-w-[180px] rounded-xl bg-white py-1.5 shadow-lg backdrop-blur-md"
        style={{
          top: rect.bottom + 4,
          right: containerRect.right - rect.right,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          disabled
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500"
        >
          <Share2 className="h-4 w-4" />
          <span>Share trip</span>
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-400 dark:bg-white/10 dark:text-gray-500">
            Soon
          </span>
        </button>
        <div className="bg-edge mx-3 h-px" />
        <button
          onClick={() => {
            close();
            setConfirming(true);
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>,
      container,
    );
  };

  const renderConfirmModal = () => {
    if (!confirming) return null;
    const container = document.getElementById("app-container");
    if (!container) return null;

    return createPortal(
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => !deleteTrip.isPending && setConfirming(false)}
        />
        <div className="relative z-10 mx-6 w-full max-w-xs rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur-xl">
          <h3 className="text-foreground text-base font-bold">Delete trip</h3>
          <p className="text-dim mt-2 text-sm">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">&ldquo;{tripName}&rdquo;</strong>? This action
            cannot be undone.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                deleteTrip.mutate(tripId, {
                  onSettled: () => setConfirming(false),
                });
              }}
              disabled={deleteTrip.isPending}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleteTrip.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleteTrip.isPending}
              className="bg-surface-soft text-foreground hover:bg-surface-hover flex-1 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      container,
    );
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        title="Trip actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {renderPopover()}
      {renderConfirmModal()}
    </div>
  );
}
