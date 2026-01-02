Summary of changes:
- Normalized Calmness display mapping so Level 2 stays at 50 and no inversion is applied on top of the mapping.
- Updated the dev note to reflect normalized Calmness display.

Files modified:
- app/sim/[sessionId]/page.tsx: adjusted escalation mapping and polarity for Calmness.

Schema changes:
- None.

Behavior changes:
- Calmness now maps Level 2 to 50 and avoids unexpected drops when deltas are zero.

Rationale:
- Prevent Calmness gauge shifts when the coach shows zero deltas.

Assumptions/known limitations:
- Calmness is now a normalized display value derived from escalation level using a 20-point step.
