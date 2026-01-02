Summary of changes:
- Renamed Calmness to Escalation across the UI and coach badge labels.
- Updated Audit Log formatting to show E/C/B/E ordering for metrics and gauges.

Files modified:
- app/sim/[sessionId]/page.tsx: escalation labels and audit log formatting.

Schema changes:
- None.

Behavior changes:
- Escalation is now shown directly (no Calmness label), and audit log entries follow ECBE formatting.

Rationale:
- Align terminology and make audit log output consistent with metric order.

Assumptions/known limitations:
- Escalation display now uses raw escalation mapping (higher is worse).
