Summary of changes:
- Moved rubric tooltips to open on the left side of the icon to avoid clipping on the right edge.

Files modified:
- app/sim/[sessionId]/page.tsx: adjusted FieldTooltip positioning.

Schema changes:
- None.

Behavior changes:
- Tooltip bubbles now appear left of the icon.

Rationale:
- Prevent tooltip overflow when the dev panel is docked on the right.

Assumptions/known limitations:
- Tooltips may overlap nearby fields if the panel is very narrow.
