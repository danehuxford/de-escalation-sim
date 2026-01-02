Summary of changes:
- Removed SMIL needle animation and applied a single transform with CSS transition so gauge needles update reliably with new values.

Files modified:
- components/MetricGauge.tsx: simplify needle transform and apply transition on the transform attribute.

Schema changes:
- None.

Behavior changes:
- Gauge needles now update consistently when values change (including Metrics Tuner overrides).

Rationale:
- The previous SMIL animateTransform was preventing the needle from updating on value changes in practice.

Assumptions/known limitations:
- Needle movement now relies on SVG transform updates with a CSS transition; if a browser ignores transitions on SVG transforms, movement will still be correct but without animation.
