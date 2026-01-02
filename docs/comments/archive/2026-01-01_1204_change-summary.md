Summary of changes:
- Added a toggle button to show/hide the combined dev panels so they don't cover Coach Me.

Files modified:
- app/sim/[sessionId]/page.tsx: dev panel visibility state and toggle button positioning.

Schema changes:
- None.

Behavior changes:
- Dev panels can be hidden and re-opened with a button; button shifts left when panels are open.

Rationale:
- Prevent dev overlays from blocking UI controls like Coach Me.

Assumptions/known limitations:
- Button sits left of the panel when open; adjust if you change panel width.
