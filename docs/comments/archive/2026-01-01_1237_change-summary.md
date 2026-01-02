Summary of changes:
- Ensured computeTurnMetrics uses the provided effective rubric config directly instead of re-resolving from env defaults.

Files modified:
- lib/scoring.ts: prefer options.rubric when supplied.

Schema changes:
- None.

Behavior changes:
- Rubric Tuner selections (easy/medium/hard) now reliably control the point scaling shown in coach responses and applied to metrics.

Rationale:
- Prevents env/profile re-resolution from overriding the dev-selected rubric.

Assumptions/known limitations:
- When no rubric is provided, scoring still uses the env-selected profile.
