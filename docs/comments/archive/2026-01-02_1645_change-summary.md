Summary of changes:
- Deduped summary/description first sentences during seed amplification.
- Added a reseed validation step that fails on duplicated opening sentences.

Files modified:
- db/seed.sql: Added normalized first-sentence comparison to omit duplicate first sentences.
- scripts/reseed.sh: Added post-seed SQL validation to detect duplicate opening sentences.

Schema changes:
- None.

Behavior changes:
- Scenario summaries/descriptions no longer repeat identical opening sentences.
- Reseed fails fast if duplicate opening sentences are detected.

Rationale:
- Prevent duplicated sentence artifacts in the Start Simulation UI.

Assumptions / known limitations:
- Validation checks only summaries, which is what the UI renders.

Follow-up notes:
- Rerun `npm run db:seed`.
