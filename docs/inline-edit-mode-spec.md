# Inline Edit Mode — Specification

> **Status:** Draft — under discussion
> **Replaces:** Separate edit page at `/trip/[id]/edit`
> **Primary target:** Mobile (touch-first design, desktop adapts from mobile)

---

## 1. Problem

The trip view currently has a separate edit page (`/trip/[id]/edit`) that:
- Only supports route-level editing (reorder/add/remove cities, adjust days)
- Has no activity editing at all
- Navigates the user away from the trip view, losing context (scroll position, mental model)
- Feels like a disconnected modal rather than a natural part of the experience

## 2. Goal

Replace the separate edit page with an **inline edit mode** within the trip page. The user stays in the same view but gains the ability to modify their itinerary directly — like switching from "view" to "edit" in a document editor.

**Mobile is the primary experience.** Every interaction is designed for touch first. Desktop inherits the same patterns and adds minor enhancements (hover states, keyboard shortcuts) where appropriate.

---

## 3. What Users Can Edit

### 3.1 Route Editing (migrated from current edit page)

| Action | Interaction (mobile) |
|--------|----------------------|
| Reorder cities | Drag via handle on city cards |
| Add a city | Tap "+" → search combobox (defaults to 3 days) |
| Remove a city | Swipe left to reveal delete, or tap delete icon |
| Adjust days per city | +/− stepper on each city card |

### 3.2 Activity Editing (new)

| Action | Interaction (mobile) |
|--------|----------------------|
| Reorder activities | Drag via handle within a day |
| Move between days | Drag an activity to a different day's drop zone (same city only — cross-city moves not supported) |
| Delete an activity | Swipe left to reveal delete, or tap delete icon |
| Edit fields | Tap activity card → expands inline form (name, duration, cost, why, food tip, pro tip) |
| Add activity (manual) | Tap "+" at bottom of day → empty inline form |
| Add activity (AI) | Tap "+" → "Suggest with AI" option → pre-filled form to review |

---

## 4. User Experience (Mobile-First)

### 4.1 Entering Edit Mode

- The hero section has an "Edit" button (pencil icon + label)
- Tapping it toggles edit mode ON — no page navigation, no loading
- A compact top banner appears: "Editing · Drag to reorder, tap to edit"
- Activity cards gain drag handles and delete affordances
- The bottom navigation bar is replaced by an edit toolbar (Save / Discard / Undo)

### 4.2 Edit Mode Layout (Mobile)

```
┌─────────────────────────┐
│ Edit mode banner        │  ← sky-blue, compact
├─────────────────────────┤
│ Hero (compact)          │
│   [Edit Route]          │  ← opens route editing bottom sheet
├─────────────────────────┤
│ City cards scroll       │  ← tap to jump to city, no drag here
├─────────────────────────┤
│ Day pills  [1] [2] [3]  │
├─────────────────────────┤
│ ≡ Activity Card         │  ← drag handle left, delete right
│ ≡ Activity Card         │
│ ≡ Activity Card (open)  │  ← tapped: expanded inline form
│   ┌─ Name: [........] ─┐│
│   │  Duration: [......]  ││
│   │  Cost: [......]      ││
│   │  Why: [............] ││
│   │            [Done]    ││
│   └──────────────────────┘│
│ [+ Add activity]        │
├─────────────────────────┤
│ [Undo] [Discard] [Save] │  ← replaces bottom nav
└─────────────────────────┘
```

### 4.3 Route Editing Bottom Sheet (Mobile)

Tapping "Edit Route" in the hero opens a bottom sheet overlay:

```
┌─────────────────────────┐
│ ── Edit Route ────── ✕  │
├─────────────────────────┤
│ ≡ Tokyo        3 days −+│  ← draggable, day stepper
│ ≡ Kyoto        2 days −+│
│ ≡ Osaka        2 days −+│
│                         │
│ [+ Add a city]          │
│                         │
│         [Done]          │
└─────────────────────────┘
```

- Drag handle on the left for reordering
- Swipe left on a city to reveal delete
- +/− buttons to adjust days
- "Done" dismisses the sheet (changes stay in the draft)

### 4.4 Exiting Edit Mode

Two paths:
1. **Save** — applies all changes, animates back to view mode
2. **Discard** — if there are unsaved changes, shows confirmation ("Discard changes?"), then exits with no changes applied

### 4.5 Touch Interactions

| Gesture | Action |
|---------|--------|
| Tap activity card | Expand/collapse inline edit form |
| Long-press + drag handle | Begin drag to reorder |
| Swipe left on activity | Reveal delete button |
| Tap "+" | Add activity (manual or AI) |
| Tap day pill | Switch visible day |

Touch drag uses a 200ms activation delay and is restricted to the drag handle icon — this prevents conflicts with scrolling.

### 4.6 Desktop Adaptations

Desktop uses the same component structure with these additions:
- Route editing panel is inline (slides down below hero) rather than a bottom sheet
- SVG DesktopTimeline swaps to the same card-based list used on mobile during edit mode
- Floating toolbar anchored to bottom-right (instead of replacing bottom nav)
- Hover states on activity cards (highlight, show drag cursor)
- Keyboard shortcuts: Ctrl+Z / Cmd+Z for undo, Escape to exit edit mode

### 4.7 Undo

- Every discrete action pushes the previous state onto an undo stack (max 20 entries)
- Undo button in the toolbar (disabled when stack is empty)
- Undo is per-action, not per-keystroke (text field changes commit on blur)

---

## 5. Inline Activity Editing

When the user taps an activity card in edit mode, it expands to reveal the form. Only one card can be expanded at a time — tapping another auto-collapses the current one.

```
┌──────────────────────────────────────────┐
│ ≡  Senso-ji Temple Visit            ✕   │  ← handle, name, delete
│    2 hours · ¥500                        │  ← summary
├──────────────────────────────────────────┤
│  Name     [Senso-ji Temple Visit     ]   │
│  Duration [2 hours                   ]   │
│  Cost     [¥500                      ]   │
│  Why      [Ancient Buddhist temple   ]   │
│           [in the heart of Asakusa   ]   │
│  Food     [Try the melon pan nearby  ]   │  ← optional
│  Tip      [Visit at sunrise for...   ]   │  ← optional
│                                 [Done]   │
└──────────────────────────────────────────┘
```

- Fields update on blur to keep the undo stack clean
- Mobile inputs use appropriate types (`text`, `number` where applicable)
- Form is scrollable within the card if it exceeds viewport

---

## 6. Adding Activities

The "+" button at the end of each day's activity list:

**Option A — Manual Entry**
Opens an empty inline form (same as the editing form). Required fields: name, duration. Everything else is optional.

**Option B — AI Suggestion**
Calls the existing per-city activity generation endpoint (`useCityActivityGeneration` hook) for the current city. The generated activities replace any empty slots for that city, and the user can then edit, reorder, or delete them inline. No single-activity variant is needed — the existing full-city generation behaviour is used as-is.

On mobile, tapping "+" shows a small action menu:
```
┌─────────────────┐
│ Add manually     │
│ Suggest with AI  │
└─────────────────┘
```

---

## 7. Save Flow

1. Strip temporary edit IDs from activities
2. Detect what changed:
   - Route changes (add/remove/reorder cities, adjust days) → may trigger regeneration
   - Activity changes (reorder, delete, edit, add) → no regeneration needed
   - Mixed → flag route changes for regeneration
3. Update Zustand store optimistically
4. Exit edit mode
5. For authenticated users: API call to create new itinerary version

If cities were added or removed, the existing "needs regeneration" banner appears after save.

---

## 8. Flight Legs (Inter-City Connections)

### 8.1 Two Separate Concerns

There are two distinct flight-related features — this spec only covers the first:

1. **Flight leg proposals** (this spec) — when the route changes, derive the logical flight/transport connections between cities. These are informational: "You'll fly from Tokyo to Bangkok, then take a train from Bangkok to Chiang Mai." No prices, no booking — just showing the user how cities connect.

2. **Flight price optimization** (future pro feature, NOT in scope) — the Amadeus-powered `POST /api/v1/trips/[id]/optimize` endpoint that shuffles dates to find the cheapest flights. This is a separate feature that will be added later as a paid upgrade.

### 8.2 Current State

The itinerary carries inter-city travel information via **`TripDay.isTravel` / `travelFrom` / `travelTo` / `travelDuration`** — set by the AI during generation. Travel days indicate transitions between cities with a suggested mode (flight, shinkansen, bus, etc.).

The gap: when a user edits the route (reorders, adds, or removes cities), the existing travel days become stale — they reference the old city order. There's no mechanism to update them. Phase 5 will add a standalone client-side utility to recalculate travel days from the new route order; it does not reuse any existing component.

### 8.3 Integration with Edit Mode

When the route changes during editing, the travel day connections need to be recalculated:

1. **On save** — if cities were reordered, added, or removed:
   - Update `isTravel` / `travelFrom` / `travelTo` fields on the appropriate days to reflect the new city order
   - For newly added cities: insert placeholder travel days at city boundaries
   - For removed cities: remove their travel days and bridge the gap
   - For reordered cities: recalculate which days are travel transitions

2. **Client-side derivation** — this is purely a data transformation, no API call needed. A utility function recalculates travel days from the route order:
   - Between each pair of consecutive cities → mark the last day of the departing city as a travel day
   - Set `travelFrom` / `travelTo` to the correct city names
   - Clear `travelDuration` (no longer accurate after reorder — the AI originally set it)

### 8.4 What Triggers Travel Day Recalculation

| Edit action | Recalculate travel days? |
|-------------|--------------------------|
| Reorder cities | Yes — connections change |
| Add a city | Yes — new connections needed |
| Remove a city | Yes — connections change |
| Adjust days per city | No — same connections, different duration |
| Reorder activities | No |
| Edit/add/delete activities | No |
| Mark rest day | No |

---

## 9. Technical Notes

### State Management
- New `useEditStore` (Zustand, no persistence) — holds draft itinerary, undo stack, and UI state
- Draft is a deep clone of the current itinerary, created when entering edit mode
- All edits mutate the draft; the original stays untouched until save
- Edit state is intentionally not persisted — refreshing mid-edit returns to view mode

### Activity Identity
- `DayActivity` currently has no `id` field — identified by array index
- On entering edit mode, assign temporary `_editId` (UUID) to every activity for stable drag-drop keys
- Strip these IDs before saving

### Drag-Drop
- Library: `@dnd-kit/core` + `@dnd-kit/sortable` (already installed)
- One `DndContext` wrapping the journey tab content
- One `SortableContext` per day (vertical list strategy)
- `DayDropZone` (useDroppable) per day for activity moves within the same city
- Sensors: `TouchSensor` (200ms delay, 5px tolerance), `PointerSensor` (8px distance), `KeyboardSensor`
- Touch sensor listed first — mobile priority

### Component Architecture

New components (all in `src/components/trip/edit/`):

| Component | Purpose |
|-----------|---------|
| `EditModeBanner` | Compact top banner indicating edit mode |
| `EditToolbar` | Bottom bar (mobile) or floating bar (desktop): Save, Discard, Undo |
| `EditRouteSheet` | Bottom sheet (mobile) or inline panel (desktop) for route editing |
| `EditableActivityCard` | Activity card with drag handle, delete, tap-to-expand |
| `InlineActivityForm` | Expandable form for editing activity fields |
| `AddActivityButton` | "+" button with manual/AI options |
| `DayDropZone` | Droppable wrapper per day for activity moves within the same city |
| `SortableCityCard` | Extracted from current edit page for reuse |

Modified components:

| Component | Changes |
|-----------|---------|
| `MobileLayout` | Accept `isEditMode`; swap bottom nav for `EditToolbar` |
| `MobileHero` | Add edit mode toggle button |
| `MobileJourneyTab` | In edit mode: wrap activities in `SortableContext`, use `EditableActivityCard`, add `AddActivityButton` |
| `DayPills` | In edit mode: rest-day toggle per pill |
| `DesktopLayout` | Accept `isEditMode`; show `EditToolbar` floating |
| `DesktopHero` | Edit mode toggle; show `EditRouteSheet` inline |
| `DesktopJourneyTab` | In edit mode: swap SVG timeline for card-based list |
| `trip/[id]/page.tsx` | Wire up edit store, pass `isEditMode` to layouts |

### Existing Edit Page
- Extract reusable pieces (SortableCityCard, change detection) into shared modules
- Redirect `/trip/[id]/edit` → `/trip/[id]?edit=true`
- Remove old page once stable

### PDF Export Update

The current PDF (`src/lib/export/pdf-generator.tsx`) only shows activity **names** in a compact day table (joined by ` · `). With inline editing, users can now customize all activity fields, so the PDF should reflect everything they've curated:

**Current PDF day table row:**
```
Day 1 | Tokyo | Senso-ji Temple · Shibuya Crossing · Ramen Alley
```

**Updated PDF — expanded activity details per day:**
```
Day 1 — Tokyo

  Senso-ji Temple Visit          2 hours · ¥500
  Ancient Buddhist temple in the heart of Asakusa
  Tip: Visit at sunrise for fewer crowds

  Shibuya Crossing               1 hour · Free
  The world's busiest pedestrian crossing
  Food: Try the nearby conveyor belt sushi
```

Changes to `TripPDFDocument`:
- Replace the compact 3-column `DayTable` with a richer per-day section grouped by city
- Each activity shows: name, duration, cost, why description
- Optionally show food tip and pro tip (if present)
- Rest days show a "Rest / Free Day" label instead of activities
- Travel days continue to show the ✈ travel indicator
- Column widths adjusted to accommodate the expanded layout

---

## 10. Implementation Phases

### Phase 1: Foundation
Edit store + edit mode toggle + edit toolbar (mobile bottom bar) + save/discard/undo + banner

### Phase 2: Route Editing
Extract SortableCityCard + build EditRouteSheet (bottom sheet on mobile, inline on desktop) + wire up route actions

### Phase 3: Activity Drag-Drop
EditableActivityCard with drag handles + reorder within day + same-city cross-day moves + delete (swipe + icon)

### Phase 4: Inline Activity Editing
Tap-to-expand InlineActivityForm + field editing + AddActivityButton (manual entry)

### Phase 5: Travel Day Recalculation
Standalone client-side utility to recalculate `isTravel` / `travelFrom` / `travelTo` on days when route changes + integrate into save flow

### Phase 6: PDF Export Update
Expand `TripPDFDocument` day table to show full activity details (duration, cost, why, tips)

### Phase 7: AI + Polish
AI activity suggestion + analytics events + keyboard shortcuts (desktop) + redirect old edit page

### Phase 8: Tests
Unit tests for edit store + component tests + Playwright E2E for mobile edit flow + cleanup

---

## 11. Open Questions

1. Should category (e.g., "Culture", "Food", "Nature") be editable, or derived from activity content?
2. Should there be a "regenerate this activity" option (replace one activity with a new AI suggestion)?
3. Do we need a "reset to original" option (revert to last saved version), separate from undo?
4. Should edit mode auto-save periodically, or only on explicit save?
5. ~~For the "move between days" drag — should it be limited to days within the same city, or allow cross-city moves?~~ **Resolved: same-city only.**
6. When recalculating travel days after route edits, should we attempt to infer transport mode (flight vs train vs bus) based on distance, or just default to "flight" and let the user edit?
