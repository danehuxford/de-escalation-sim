Summary of changes:
- Rebuilt scenario summaries/descriptions to a consistent four-sentence format without duplication and with department/scenario-type-specific language.

Files modified:
- db/seed.sql: Replaced the post-seed update to generate unique, non-duplicative 4-sentence summaries/descriptions.

Schema changes:
- None.

Behavior changes:
- Scenario summaries and descriptions now reflect department + scenario type with unique sentences, avoiding repeated text.

Rationale:
- Ensure descriptions feel distinct per department and scenario type while staying deterministic.

Assumptions / known limitations:
- Summary/description are rebuilt from the first sentence of existing values plus mapped sentences.

Follow-up notes:
- Rerun `npm run db:seed` to apply the updated summary/description text.
