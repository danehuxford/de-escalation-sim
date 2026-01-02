Summary of changes:
- Added a dev-only rubric tuner API with in-memory overrides and profile control.
- Added a dev-only Rubric Tuner overlay to the Simulation page with localStorage persistence and apply/reset controls.

Files modified:
- app/api/dev/rubric/route.ts: dev-only GET/POST rubric overrides and effective config.
- app/sim/[sessionId]/page.tsx: Rubric Tuner overlay UI, state, and client wiring.

Schema changes:
- None.

Behavior changes:
- When NEXT_PUBLIC_ENABLE_RUBRIC_TUNER=true in dev, rubric overrides can be adjusted live and persisted locally.

Rationale:
- Enable safe, deterministic tuning of scoring parameters during development.

Assumptions/known limitations:
- Overrides are stored in-memory on the dev server and are not persisted across server restarts.
