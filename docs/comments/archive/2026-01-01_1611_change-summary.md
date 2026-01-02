Summary of changes:
- Switched the dev panel overlay layout to a vertical stack so panels appear one under another.

Files modified:
- app/sim/[sessionId]/page.tsx: replaced grid with a vertical flex column.

Schema changes:
- None.

Behavior changes:
- Dev panels now stack vertically instead of horizontally.

Rationale:
- Match requested vertical layout for easier scanning.

Assumptions/known limitations:
- Overlay content may require more scrolling on shorter screens.
