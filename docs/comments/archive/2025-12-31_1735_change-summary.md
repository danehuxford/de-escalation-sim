Summary of changes:
- Added easy/medium/hard rubric profiles with per-turn clamp sizes (10/5/1) and exposed them in the Rubric Tuner profile override dropdown.
- Applied rubric per-turn clamp for any non-strict profile to ensure easy/medium/hard affect scoring.

Files modified:
- lib/rubric.ts: added easy/medium/hard profiles and profile resolution.
- lib/scoring.ts: apply per-turn clamp for non-strict profiles.
- app/sim/[sessionId]/page.tsx: updated profile override options to easy/medium/hard.

Schema changes:
- None.

Behavior changes:
- Selecting easy/medium/hard now adjusts per-turn deltas to 10/5/1 caps respectively.

Rationale:
- Provide clear difficulty presets that increase or decrease scoring responsiveness.

Assumptions/known limitations:
- Training/strict profiles still exist internally for backward compatibility; easy/medium/hard affect clamping only.
