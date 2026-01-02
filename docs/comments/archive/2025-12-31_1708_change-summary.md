Summary of changes:
- Updated the coach delta badge label to show Calmness instead of Escalation when the metric is inverted for display.

Files modified:
- app/sim/[sessionId]/page.tsx: conditional label for the escalation delta pill.

Schema changes:
- None.

Behavior changes:
- Coach badges now reflect Calmness wording when escalation polarity is lower-better.

Rationale:
- Match UI terminology to inverted escalation display.

Assumptions/known limitations:
- Only affects coach card badge text; underlying deltas remain unchanged.
