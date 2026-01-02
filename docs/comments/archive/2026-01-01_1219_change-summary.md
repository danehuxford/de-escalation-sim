Summary of changes:
- Made easy/medium/hard rubric profiles apply the full per-turn max delta to any non-zero metric change, so positive signals award the full 10/5/1 points.

Files modified:
- lib/scoring.ts: normalize deltas for easy/medium/hard profiles before clamping.

Schema changes:
- None.

Behavior changes:
- In easy/medium/hard profiles, any positive delta becomes the profile's max (10/5/1) and any negative delta becomes the profile's min.

Rationale:
- Match user expectation that easy/medium/hard give full points per affected metric.

Assumptions/known limitations:
- Neutral deltas (0) remain unchanged; negatives scale to full negative clamp.
