Summary of changes:
- Restored Calmness display behavior by treating escalation as lower-better and mapping escalation levels to a normalized 0..100 value before inversion.
- Updated the coach debug note to show only when Calmness inversion is active.

Files modified:
- app/sim/[sessionId]/page.tsx: adjusted escalation polarity and mapping.

Schema changes:
- None.

Behavior changes:
- Calmness now increases when escalation decreases, and gauge labels align with the coach delta semantics.

Rationale:
- Ensure gauge movement matches coach deltas and avoids showing escalating values as positive.

Assumptions/known limitations:
- Level 2 maps to 40 (then inverts to 60); the start-of-session override still forces 50.
