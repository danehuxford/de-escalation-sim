Summary of changes:
- Forced the dev panel overlay into a three-column layout on large screens and removed Metrics/Rubric expand/collapse controls so panels stay expanded.

Files modified:
- app/sim/[sessionId]/page.tsx: updated dev panel grid and removed collapse UI/logic.

Schema changes:
- None.

Behavior changes:
- Dev panels remain expanded and visible in three columns on large screens.

Rationale:
- Keep all dev content visible at once for faster debugging.

Assumptions/known limitations:
- On small screens, panels still stack vertically.
