Summary of changes:
- Forced schema check constraints for scenario_type to refresh so new canonical values are accepted.

Files modified:
- db/schema.sql: Drop and recreate scenario_type check constraints for scenarios and sessions.
- docs/db/schema.sql: Kept reference schema aligned to the canonical scenario types.

Schema changes:
- scenarios_scenario_type_check and sessions_scenario_type_check are dropped and recreated.

Behavior changes:
- Session inserts now accept the canonical ScenarioType values.

Rationale:
- Existing constraints were not updated because the previous script only added them when missing.

Assumptions / known limitations:
- If legacy rows contain removed scenario types, the new constraint will block until data is updated.

Follow-up notes:
- Rerun `npm run db:seed` to apply the updated constraints and reseed.
