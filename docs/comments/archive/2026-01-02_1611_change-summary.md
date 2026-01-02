Summary of changes:
- Intensified scenario summaries/descriptions with emotionally grounded, department- and scenario-type-specific sentences.

Files modified:
- db/seed.sql: Updated the post-seed summary/description builder with refined, non-duplicative language.

Schema changes:
- None.

Behavior changes:
- Scenario narrative text is more vivid and context-specific after reseed.

Rationale:
- Increase training realism and emotional clarity without altering taxonomy or metadata.

Assumptions / known limitations:
- Existing summaries/descriptions are rebuilt from the first sentence of each field plus new mapped sentences.

Follow-up notes:
- Rerun `npm run db:seed` to apply the updated narrative text.
