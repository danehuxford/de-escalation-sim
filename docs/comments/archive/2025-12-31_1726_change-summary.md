Summary of changes:
- Merged the Metrics Tuner and Rubric Tuner into a single dev panel container with separate collapsible sections.

Files modified:
- app/sim/[sessionId]/page.tsx: combined dev panels into one wrapper and adjusted layout.

Schema changes:
- None.

Behavior changes:
- Dev tuners now appear in a single combined panel (bottom-right) when enabled.

Rationale:
- Reduce overlay clutter and keep dev tooling in one place.

Assumptions/known limitations:
- The combined panel uses a fixed width and scrolls if content exceeds viewport height.
