Summary of changes:
- Scaled easy/medium/hard profile deltas by 10/5/1 per point so a +2 boundary delta becomes +20 in easy mode.
- Updated easy/medium/hard clamp ranges to allow the scaled deltas (±50/±25/±5).

Files modified:
- lib/rubric.ts: adjusted per-turn clamp defaults for easy/medium/hard profiles.
- lib/scoring.ts: scale deltas by profile before clamping for non-strict profiles.

Schema changes:
- None.

Behavior changes:
- Easy/medium/hard profiles now multiply deltas (easy=10x, medium=5x, hard=1x) before applying clamps.

Rationale:
- Align rubric behavior with the expectation that each delta point maps to 10/5/1 score points.

Assumptions/known limitations:
- Training profile behavior remains unchanged; only easy/medium/hard apply scaling.
