Summary of changes:
- Added department-specific persona_seed and constraints_refs enrichments during seeding.
- Extended runtime prompt types and builder to include red_lines, calming_signals, and escalation_boundaries.

Files modified:
- db/seed.sql: Appended red_lines, calming_signals, and escalation_boundaries based on department.
- lib/types.ts: Added new persona and constraints fields.
- lib/deesRuntime.ts: Merged new fields into runtime JSON output.

Schema changes:
- None.

Behavior changes:
- Runtime JSON now includes persona.red_lines, persona.calming_signals, and constraints.escalation_boundaries.
- Seeded scenarios include department-tuned fields for realism.

Rationale:
- Improve scenario realism while keeping structured, deterministic runtime output.

Assumptions / known limitations:
- Department-specific enrichments are shared across scenario types within a department.

Follow-up notes:
- Rerun `npm run db:seed` to apply updated persona/constraints data.
