Summary of changes:
- Switched MetricGauge needle rendering to direct endpoint computation to ensure visible movement with small value changes.

Files modified:
- components/MetricGauge.tsx: compute needle tip with pointOnArc and render line directly (no SVG transform).

Schema changes:
- None.

Behavior changes:
- Gauge needles now update position deterministically based on value without transform-related rendering issues.

Rationale:
- Address reports of needle not moving by avoiding SVG transform animation quirks.

Assumptions/known limitations:
- Needle animation is a simple position transition; if a browser ignores SVG attribute transitions, movement will be immediate but still correct.
