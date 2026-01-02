Summary of changes:
- Made scenario seeding idempotent by checking department + scenario_type instead of title.
- Expanded dev diagnostics to return per-department scenario counts when no department filter is provided.

Files modified:
- db/seed.sql: Updated reseed guard to prevent duplicate scenario types per department.
- app/api/dev/scenario-counts/route.ts: Added per-department counts map in dev diagnostics.

Schema changes:
- None.

Behavior changes:
- Reseeding now skips existing scenarios by department + scenario_type.
- Dev diagnostics can report scenario counts for all departments.

Rationale:
- Ensure each department has one scenario per ScenarioType without duplicates and make verification easier.

Assumptions / known limitations:
- Existing scenarios with mismatched scenario_type still require reseeding to correct.

Follow-up notes:
- Rerun `npm run db:seed` after updating Supabase.
