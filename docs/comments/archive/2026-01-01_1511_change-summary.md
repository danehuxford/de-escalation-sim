Summary of changes:
- Added a dev-only audit log panel that records coach deltas, metrics before/after, and gauge values before/after for each user turn.
- Logged audit entries on both AI and fallback paths.

Files modified:
- app/sim/[sessionId]/page.tsx: added audit log state, entry capture, and UI panel.

Schema changes:
- None.

Behavior changes:
- Dev panels now include an Audit Log section when debug is enabled.

Rationale:
- Provide visibility into scoring vs gauge movement to diagnose inconsistencies.

Assumptions/known limitations:
- Audit log is kept in memory (last 50 entries) and resets on refresh.
