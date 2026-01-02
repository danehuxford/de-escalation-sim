Summary of changes:
- Appended a deterministic 4-sentence description format to all scenarios during seeding.

Files modified:
- db/seed.sql: Added a post-insert update to expand descriptions with two extra sentences.

Schema changes:
- None.

Behavior changes:
- Scenario descriptions are expanded to four sentences on reseed.

Rationale:
- Improve scenario realism while keeping seeding idempotent.

Assumptions / known limitations:
- Existing descriptions already containing the appended sentence are left unchanged.

Follow-up notes:
- Rerun `npm run db:seed` to apply the description updates.
