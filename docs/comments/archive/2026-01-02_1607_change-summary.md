Summary of changes:
- Qualified summary/description references in the scenario update expressions to avoid ambiguity.

Files modified:
- db/seed.sql: Prefixed summary/description with scenarios in split_part usage.

Schema changes:
- None.

Behavior changes:
- None (same update logic; unambiguous execution).

Rationale:
- Fix Postgres ambiguity error in the update statement.

Assumptions / known limitations:
- None.

Follow-up notes:
- Rerun `npm run db:seed`.
