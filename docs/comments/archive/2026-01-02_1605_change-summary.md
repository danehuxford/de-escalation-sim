Summary of changes:
- Qualified summary/description references in the scenario update to avoid ambiguous column errors.

Files modified:
- db/seed.sql: Prefixed summary/description with scenarios in the update WHERE clause.

Schema changes:
- None.

Behavior changes:
- None (same update logic; unambiguous execution).

Rationale:
- Fix Postgres ambiguity when joining departments in the update.

Assumptions / known limitations:
- None.

Follow-up notes:
- Rerun `npm run db:seed`.
