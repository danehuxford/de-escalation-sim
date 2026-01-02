Summary of changes:
- Adjusted rubric tooltip positioning to render to the right side so the full text is visible within the dev panel.

Files modified:
- app/sim/[sessionId]/page.tsx: repositioned FieldTooltip popover.

Schema changes:
- None.

Behavior changes:
- Tooltip bubbles now appear to the right of the icon instead of below.

Rationale:
- Prevent tooltip text from being clipped by the panel container.

Assumptions/known limitations:
- Tooltip may overflow if the panel is close to the right viewport edge.
