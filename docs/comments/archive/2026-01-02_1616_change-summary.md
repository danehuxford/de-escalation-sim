Summary of changes:
- Replaced invalid \' escaping with doubled single quotes in seed SQL.
- Added a preflight check to block reseed when db/seed.sql contains \' sequences.

Files modified:
- db/seed.sql: Corrected apostrophe escaping.
- scripts/reseed.sh: Added guard for invalid SQL escaping.

Schema changes:
- None.

Behavior changes:
- Reseed fails fast with a clear error when invalid escaping is detected.

Rationale:
- Ensure db/seed.sql runs under default Postgres settings and prevent regressions.

Assumptions / known limitations:
- Preflight requires rg; if unavailable, the guard will not run.

Follow-up notes:
- Rerun `npm run db:seed`.
