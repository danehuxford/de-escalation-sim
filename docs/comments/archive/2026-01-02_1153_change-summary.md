Summary of changes:
- Added Billing/Registration seed data (department + 10 scenarios) and ensured scenario filtering by type runs in the query.
- Added dev diagnostics/logging for scenario counts and a dev-only reseed script plus README usage notes.
- Added a UI debug hint when no scenarios are found in dev mode.

Files modified:
- db/seed.sql: Added BILLING_REG department and 10 scenario seeds.
- lib/db/scenarios.ts: Added optional scenario_type filter to queries.
- app/page.tsx: Fetch scenarios by type, add dev debug hint, and trigger dev diagnostics logging.
- app/api/dev/scenario-counts/route.ts: Dev-only counts endpoint with server-side logging.
- scripts/reseed.sh: Dev-only reseed script using psql.
- package.json: Added db:seed script.
- README.md: Documented dev reseed usage.

Schema changes:
- None.

Behavior changes:
- Scenario list filtering now uses server-side scenario_type filtering.
- Dev mode shows a debug hint when no scenarios match.
- Dev server logs counts for departments and scenarios via the diagnostics endpoint.

Rationale:
- Ensure each department has full scenario coverage and make reseeding safe and repeatable in dev.

Assumptions / known limitations:
- Reseed script requires psql and SUPABASE_DB_URL or DATABASE_URL.
- Diagnostics endpoint is disabled unless NEXT_PUBLIC_DEBUG_AI=1 and NODE_ENV is not production.

Follow-up notes:
- Apply db/schema.sql and db/seed.sql to Supabase if the cloud DB is out of date.
