Summary of changes:
- Replaced native title hovers with custom tooltip components in the Rubric Tuner so explanations are visible in the overlay.

Files modified:
- app/sim/[sessionId]/page.tsx: added FieldTooltip component and wired it to rubric labels.

Schema changes:
- None.

Behavior changes:
- Tooltip bubbles now appear on hover for each rubric field label.

Rationale:
- Native title tooltips are unreliable inside the overlay; custom tooltips ensure consistent visibility.

Assumptions/known limitations:
- Tooltips appear on hover (mouse); no focus/keyboard trigger yet.
