Summary of changes:
- Wired the Rubric Tuner effective config into scoring so deltas and displayed points reflect the selected easy/medium/hard profile.

Files modified:
- app/sim/[sessionId]/page.tsx: pass rubricEffective into computeTurnMetrics during send.

Schema changes:
- None.

Behavior changes:
- Coach badge deltas and metric updates now follow the active rubric profile (easy/medium/hard).

Rationale:
- Ensure point values shown in responses match rubric selection.

Assumptions/known limitations:
- When the Rubric Tuner is disabled, scoring uses the default profile from env.
