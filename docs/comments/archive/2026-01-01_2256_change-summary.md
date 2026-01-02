Summary of changes:
- Expanded scenario types to the 10 universal set and aligned schema/type definitions.
- Seeded 10 departments and 100 scenarios with persona_seed and constraints_refs JSON.
- Updated runtime prompt builder, scenario query ordering, and UI filtering/summary display to scale scenario selection.

Files modified:
- lib/types.ts: Replaced ScenarioType list and added typed persona/constraints shapes.
- db/schema.sql: Updated scenario_type checks and migrated constraints_refs to jsonb.
- docs/db/schema.sql: Updated reference schema checks and constraints_refs type.
- db/seed.sql: Added department seed data and 10 scenarios per department with JSON seeds.
- lib/db/scenarios.ts: Ordered scenarios by type and title for stable grouping.
- lib/deesRuntime.ts: Merged scenario summary/persona/constraints into runtime JSON.
- app/page.tsx: Added scenario type filter and uses filtered list for selection.

Schema changes:
- ScenarioType check constraints updated to the new 10 universal types.
- scenarios.constraints_refs changed from text[] to jsonb (with migration guard).

Behavior changes:
- Scenario lists are ordered by type/title and can be filtered by scenario type.
- Runtime prompt now includes scenario summary, persona_seed details, and constraints_refs.
- Seed data now provides 10 departments with 10 scenarios each.

Rationale:
- Align data model and UI with the multi-department, universal scenario taxonomy.
- Keep runtime prompt deterministic while adding richer scenario metadata.

Assumptions / known limitations:
- Existing databases need the updated schema.sql applied for constraints_refs jsonb.
- Scenario success/failure criteria default unless provided in persona_seed.

Follow-up notes:
- Apply db/schema.sql and db/seed.sql to Supabase after pulling changes.
