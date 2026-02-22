import { create } from "zustand";
import type { Itinerary, DayActivity } from "@/types";

// ============================================================
// Editable activity — adds a stable _editId for dnd-kit keys
// ============================================================
export interface EditableActivity extends DayActivity {
  _editId: string;
}

// ============================================================
// Itinerary with editable activities (days use EditableActivity)
// ============================================================
export interface EditItinerary extends Omit<Itinerary, "days"> {
  days: (Omit<Itinerary["days"][number], "activities"> & {
    activities: EditableActivity[];
  })[];
}

// ============================================================
// State
// ============================================================
interface EditStoreState {
  isEditMode: boolean;
  draft: EditItinerary | null;
  undoStack: EditItinerary[];
  /** Which activity is expanded in the inline form — keyed by _editId */
  expandedActivityId: string | null;
  /** Whether the route editing sheet/panel is open */
  isRouteSheetOpen: boolean;
}

interface EditStoreActions {
  enterEditMode: (itinerary: Itinerary) => void;
  exitEditMode: () => void;
  /** Commit the draft to the provided save callback, then exit */
  saveAndExit: (onSave: (itinerary: Itinerary) => void) => void;
  /** Push current draft to undo stack, then apply updater */
  updateDraft: (updater: (draft: EditItinerary) => EditItinerary) => void;
  undo: () => void;
  setExpandedActivityId: (id: string | null) => void;
  setRouteSheetOpen: (open: boolean) => void;
}

// ============================================================
// Helpers
// ============================================================

function assignEditIds(itinerary: Itinerary): EditItinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day) => ({
      ...day,
      activities: day.activities.map((act) => ({
        ...act,
        _editId: crypto.randomUUID(),
      })),
    })),
  };
}

function stripEditIds(draft: EditItinerary): Itinerary {
  return {
    ...draft,
    days: draft.days.map((day) => ({
      ...day,
      activities: day.activities.map(({ _editId, ...act }) => act),
    })),
  };
}

const MAX_UNDO = 20;

// ============================================================
// Store
// ============================================================
export const useEditStore = create<EditStoreState & EditStoreActions>()((set, get) => ({
  isEditMode: false,
  draft: null,
  undoStack: [],
  expandedActivityId: null,
  isRouteSheetOpen: false,

  enterEditMode: (itinerary) => {
    set({
      isEditMode: true,
      draft: assignEditIds(itinerary),
      undoStack: [],
      expandedActivityId: null,
      isRouteSheetOpen: false,
    });
  },

  exitEditMode: () => {
    set({
      isEditMode: false,
      draft: null,
      undoStack: [],
      expandedActivityId: null,
      isRouteSheetOpen: false,
    });
  },

  saveAndExit: (onSave) => {
    const { draft } = get();
    if (draft) {
      onSave(stripEditIds(draft));
    }
    set({
      isEditMode: false,
      draft: null,
      undoStack: [],
      expandedActivityId: null,
      isRouteSheetOpen: false,
    });
  },

  updateDraft: (updater) => {
    set((state) => {
      if (!state.draft) return state;
      const prev = state.draft;
      const next = updater(prev);
      const stack = [prev, ...state.undoStack].slice(0, MAX_UNDO);
      return { draft: next, undoStack: stack };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const [head, ...rest] = state.undoStack;
      return { draft: head, undoStack: rest };
    });
  },

  setExpandedActivityId: (id) => set({ expandedActivityId: id }),

  setRouteSheetOpen: (open) => set({ isRouteSheetOpen: open }),
}));
