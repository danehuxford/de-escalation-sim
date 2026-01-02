Summary of changes:
- Split the full-screen dev panel overlay into responsive columns for Metrics, Rubric, and Audit panels.

Files modified:
- app/sim/[sessionId]/page.tsx: updated dev panel layout to a multi-column grid.

Schema changes:
- None.

Behavior changes:
- Dev overlay now shows panels side-by-side on larger screens.

Rationale:
- Improve visibility of all dev panels at once.

Assumptions/known limitations:
- On smaller screens, panels stack vertically.
