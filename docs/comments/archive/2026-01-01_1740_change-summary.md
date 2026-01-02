Summary of changes:
- Made the Audit Log more visual with delta pills and boxed before/after rows for Metrics and Gauges.

Files modified:
- app/sim/[sessionId]/page.tsx: redesigned audit log entry layout.

Schema changes:
- None.

Behavior changes:
- Audit Log now displays deltas as colored pills and structured rows for metrics/gauges.

Rationale:
- Improve readability now that the dev overlay has more space.

Assumptions/known limitations:
- Layout is optimized for the dev overlay; mobile will stack columns.
