Summary of changes:
- Updated the dev overlay to use vertical columns (side-by-side panels) with fixed widths.

Files modified:
- app/sim/[sessionId]/page.tsx: changed dev panel layout to a horizontal flex row with column widths.

Schema changes:
- None.

Behavior changes:
- Metrics, Rubric, and Audit panels now display as columns across the overlay.

Rationale:
- Match requested column layout while keeping panels stacked vertically within each column.

Assumptions/known limitations:
- Panels may overflow horizontally on smaller screens; the overlay will scroll.
