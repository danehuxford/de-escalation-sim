Summary of changes:
- Expanded scenario summaries to the same 4-sentence format used for descriptions during reseed.

Files modified:
- db/seed.sql: Added summary update alongside description in the post-insert expansion step.

Schema changes:
- None.

Behavior changes:
- Scenario summaries now expand to four sentences on reseed.

Rationale:
- The UI displays summary, so it must carry the expanded text.

Assumptions / known limitations:
- Summaries already containing the appended sentence are left unchanged.

Follow-up notes:
- Rerun `npm run db:seed` to apply the summary updates.
