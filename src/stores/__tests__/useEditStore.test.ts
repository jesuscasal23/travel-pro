// ============================================================
// Unit tests for useEditStore
//
// Covers:
//   - enterEditMode: assigns _editId, resets undo stack
//   - exitEditMode: clears all state
//   - updateDraft: pushes to undo stack, applies updater
//   - undo: restores previous draft, pops stack
//   - undo stack max (20 entries)
//   - saveAndExit: strips _editId, calls callback, clears state
//   - setExpandedActivityId / setRouteSheetOpen helpers
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEditStore } from "@/stores/useEditStore";
import type { Itinerary } from "@/types";

// ── Test fixture ──────────────────────────────────────────────────────────────

function makeItinerary(overrides?: Partial<Itinerary>): Itinerary {
  return {
    route: [
      {
        id: "city-1",
        city: "Tokyo",
        country: "Japan",
        lat: 35.68,
        lng: 139.69,
        days: 3,
        countryCode: "JP",
      },
    ],
    days: [
      {
        day: 1,
        date: "2026-04-01",
        city: "Tokyo",
        activities: [
          { name: "Shibuya Crossing", category: "Culture", why: "Iconic", duration: "1h" },
          { name: "Ramen lunch", category: "Food", why: "Local food", duration: "1h" },
        ],
      },
      {
        day: 2,
        date: "2026-04-02",
        city: "Tokyo",
        activities: [],
      },
    ],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useEditStore", () => {
  beforeEach(() => {
    // Reset store between tests by triggering exitEditMode
    const { result } = renderHook(() => useEditStore());
    act(() => result.current.exitEditMode());
  });

  // ── enterEditMode ──────────────────────────────────────────────────────────

  describe("enterEditMode", () => {
    it("sets isEditMode to true", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      expect(result.current.isEditMode).toBe(true);
    });

    it("assigns unique _editId to every activity", () => {
      const { result } = renderHook(() => useEditStore());
      const itinerary = makeItinerary();
      act(() => result.current.enterEditMode(itinerary));

      const ids = result.current.draft!.days.flatMap((d) => d.activities.map((a) => a._editId));
      expect(ids).toHaveLength(2);
      // All IDs are non-empty strings
      ids.forEach((id) => expect(typeof id).toBe("string"));
      // IDs are unique
      expect(new Set(ids).size).toBe(2);
    });

    it("resets undoStack to empty", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      // Make a change to put something on the stack
      act(() => result.current.updateDraft((d) => ({ ...d })));
      // Re-enter edit mode — stack should reset
      act(() => result.current.enterEditMode(makeItinerary()));
      expect(result.current.undoStack).toHaveLength(0);
    });

    it("resets expandedActivityId to null", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      act(() => result.current.setExpandedActivityId("some-id"));
      act(() => result.current.enterEditMode(makeItinerary()));
      expect(result.current.expandedActivityId).toBeNull();
    });

    it("does not mutate the original itinerary", () => {
      const { result } = renderHook(() => useEditStore());
      const itinerary = makeItinerary();
      const originalActivity = itinerary.days[0].activities[0];
      act(() => result.current.enterEditMode(itinerary));
      // Original should not have _editId
      expect((originalActivity as unknown as Record<string, unknown>)._editId).toBeUndefined();
    });
  });

  // ── exitEditMode ───────────────────────────────────────────────────────────

  describe("exitEditMode", () => {
    it("clears all edit state", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      act(() => result.current.updateDraft((d) => ({ ...d })));
      act(() => result.current.setExpandedActivityId("some-id"));
      act(() => result.current.setRouteSheetOpen(true));
      act(() => result.current.exitEditMode());

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.draft).toBeNull();
      expect(result.current.undoStack).toHaveLength(0);
      expect(result.current.expandedActivityId).toBeNull();
      expect(result.current.isRouteSheetOpen).toBe(false);
    });
  });

  // ── updateDraft ────────────────────────────────────────────────────────────

  describe("updateDraft", () => {
    it("applies the updater function to the draft", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      act(() =>
        result.current.updateDraft((d) => ({
          ...d,
          route: [{ ...d.route[0], city: "Osaka" }],
        }))
      );

      expect(result.current.draft!.route[0].city).toBe("Osaka");
    });

    it("pushes the previous draft onto the undo stack", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      const draftBefore = result.current.draft!;

      act(() => result.current.updateDraft((d) => ({ ...d, route: [] })));

      expect(result.current.undoStack).toHaveLength(1);
      expect(result.current.undoStack[0]).toBe(draftBefore);
    });

    it("stacks multiple changes in LIFO order", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      act(() =>
        result.current.updateDraft((d) => ({ ...d, route: [{ ...d.route[0], city: "A" }] }))
      );
      act(() =>
        result.current.updateDraft((d) => ({ ...d, route: [{ ...d.route[0], city: "B" }] }))
      );

      expect(result.current.undoStack).toHaveLength(2);
      // Most recent pushed first
      expect(result.current.undoStack[0].route[0].city).toBe("A");
    });

    it("does nothing when draft is null", () => {
      const { result } = renderHook(() => useEditStore());
      // Not in edit mode — draft is null
      act(() => result.current.updateDraft((d) => ({ ...d })));
      expect(result.current.draft).toBeNull();
      expect(result.current.undoStack).toHaveLength(0);
    });
  });

  // ── undo ───────────────────────────────────────────────────────────────────

  describe("undo", () => {
    it("restores the previous draft", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      const original = result.current.draft!;

      act(() => result.current.updateDraft((d) => ({ ...d, route: [] })));
      act(() => result.current.undo());

      expect(result.current.draft).toBe(original);
    });

    it("removes the restored entry from the stack", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      act(() => result.current.updateDraft((d) => ({ ...d })));
      act(() => result.current.updateDraft((d) => ({ ...d })));
      expect(result.current.undoStack).toHaveLength(2);

      act(() => result.current.undo());
      expect(result.current.undoStack).toHaveLength(1);
    });

    it("does nothing when stack is empty", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      const draft = result.current.draft;
      act(() => result.current.undo());
      expect(result.current.draft).toBe(draft);
    });

    it("supports multiple undos", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      act(() =>
        result.current.updateDraft((d) => ({ ...d, route: [{ ...d.route[0], city: "A" }] }))
      );
      act(() =>
        result.current.updateDraft((d) => ({ ...d, route: [{ ...d.route[0], city: "B" }] }))
      );
      expect(result.current.draft!.route[0].city).toBe("B");

      act(() => result.current.undo());
      expect(result.current.draft!.route[0].city).toBe("A");

      act(() => result.current.undo());
      expect(result.current.draft!.route[0].city).toBe("Tokyo");
    });
  });

  // ── undo stack max ─────────────────────────────────────────────────────────

  describe("undo stack limit", () => {
    it("caps the undo stack at 20 entries", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      for (let i = 0; i < 25; i++) {
        act(() => result.current.updateDraft((d) => ({ ...d })));
      }

      expect(result.current.undoStack.length).toBeLessThanOrEqual(20);
    });
  });

  // ── saveAndExit ────────────────────────────────────────────────────────────

  describe("saveAndExit", () => {
    it("calls the callback with the draft stripped of _editIds", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));

      let saved: Itinerary | null = null;
      act(() =>
        result.current.saveAndExit((it) => {
          saved = it;
        })
      );

      expect(saved).not.toBeNull();
      saved!.days.forEach((day) => {
        day.activities.forEach((act) => {
          expect((act as unknown as Record<string, unknown>)._editId).toBeUndefined();
        });
      });
    });

    it("clears all state after saving", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.enterEditMode(makeItinerary()));
      act(() => result.current.saveAndExit(() => {}));

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.draft).toBeNull();
      expect(result.current.undoStack).toHaveLength(0);
    });

    it("does not call callback when draft is null", () => {
      const { result } = renderHook(() => useEditStore());
      let called = false;
      act(() =>
        result.current.saveAndExit(() => {
          called = true;
        })
      );
      expect(called).toBe(false);
    });
  });

  // ── setExpandedActivityId ──────────────────────────────────────────────────

  describe("setExpandedActivityId", () => {
    it("sets the expanded activity id", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.setExpandedActivityId("abc-123"));
      expect(result.current.expandedActivityId).toBe("abc-123");
    });

    it("can be cleared to null", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.setExpandedActivityId("abc-123"));
      act(() => result.current.setExpandedActivityId(null));
      expect(result.current.expandedActivityId).toBeNull();
    });
  });

  // ── setRouteSheetOpen ──────────────────────────────────────────────────────

  describe("setRouteSheetOpen", () => {
    it("opens and closes the route sheet", () => {
      const { result } = renderHook(() => useEditStore());
      act(() => result.current.setRouteSheetOpen(true));
      expect(result.current.isRouteSheetOpen).toBe(true);
      act(() => result.current.setRouteSheetOpen(false));
      expect(result.current.isRouteSheetOpen).toBe(false);
    });
  });
});
