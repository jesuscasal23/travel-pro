# UI Restructure Backlog

This document tracks the cleanup and integration work after consolidating the app around the canonical mobile-first flow.

## Current Canonical Flow

- `/get-started`
- `/plan`
- `/trips`
- `/trip/[id]`
- `/profile`
- `/share/[token]`

## Now

- Wire the canonical profile UI to the real profile API.
- Add frontend support for fetching persisted profile data from `GET /api/v1/profile`.
- Persist planner profile inputs to the backend for authenticated users.
- Ensure signed-in trip creation attaches trips to a stored profile instead of falling back to guest ownership.
- Reconcile local Zustand profile fields with backend profile fields so `/plan` and `/profile` show the same data.
- Expose backend-backed profile actions where support already exists:
  - Travel DNA / preferences
  - profile export
  - account deletion
- Decide whether `/api/v1/trips` should return `[]` or auto-create a profile when an authenticated user has no profile row.

## Next

- Turn the visible `Travel DNA` mock into a real editable profile section.
- Rename or narrow `Personal Info` so it only promises fields the backend actually supports.
- Add clear UX states for profile save success, save failure, and unauthenticated access.
- Revisit `/profile` information architecture after backend-backed sections are live.
- Decide whether planner completion should mark `onboardingCompleted`.
- Verify that trip generation, share, and edit flows still work after profile persistence changes.

## Later

- Decide whether `Discover` remains a visible preview or is removed.
- Decide whether `Bookings` remains a visible preview or is removed.
- If `Discover` stays, define the real backend product:
  - destination feed
  - search
  - saved destinations
- If `Bookings` stays, define the real backend product:
  - booking model
  - trip-linked reservations
  - import/sync strategy
  - booking status and timeline data
- Decide whether `Need Help` becomes real support chat, contact flow, or gets removed.
- Decide whether `Travel Documents`, `Payments`, `Login & Security`, and `App Settings` warrant backend support or should stay hidden until scoped.

## Cleanup

- Remove unused UI code that is no longer reachable and not intentionally exposed as mock UI.
- Remove dead tests or rewrite them around the canonical route flow.
- Keep mock labels visible on any remaining preview-only actions.
- Audit route redirects and auth redirects for references to removed legacy flows.

## Verification

- Run `npm run typecheck` after each cleanup batch.
- Keep targeted unit tests updated when API hooks or route guards change.
- Run focused e2e coverage for:
  - sign up -> trips
  - plan -> trip
  - profile save
  - share flow
