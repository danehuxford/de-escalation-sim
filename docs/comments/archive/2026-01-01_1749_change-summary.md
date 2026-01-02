Summary of changes:
- Adjusted escalation gauge mapping so Level 2 corresponds to a neutral 50, preventing drops when deltas are zero.

Files modified:
- app/sim/[sessionId]/page.tsx: updated escalationLevelToGauge mapping.

Schema changes:
- None.

Behavior changes:
- Escalation gauge now centers at 50 for Level 2, with 20-point steps per level.

Rationale:
- Align gauge position with the expected neutral baseline when no escalation delta occurs.

Assumptions/known limitations:
- Level 5 clamps to 100; level 0 clamps to 10.
