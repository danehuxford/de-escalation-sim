Summary of changes:
- Qualified scenario seed column references to avoid ambiguous description in the scenarios insert.

Files modified:
- db/seed.sql: Prefixed scenario_seed columns in the SELECT list.

Schema changes:
- None.

Behavior changes:
- None (same data, unambiguous select).

Rationale:
- Fix Postgres ambiguity when joining departments with scenario_seed.

Assumptions / known limitations:
- None.

Follow-up notes:
- Rerun `npm run db:seed` after updating.
