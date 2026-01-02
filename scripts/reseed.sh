#!/usr/bin/env bash
set -euo pipefail

if [[ "${NODE_ENV:-development}" == "production" ]]; then
  echo "Refusing to reseed in production."
  exit 1
fi

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
if [[ -z "${DB_URL}" ]]; then
  echo "Missing SUPABASE_DB_URL or DATABASE_URL."
  exit 1
fi

if rg -n "\\\\'" db/seed.sql >/dev/null 2>&1; then
  echo "Invalid escaping found in db/seed.sql."
  echo "Use doubled single quotes ('') instead of \\' in SQL string literals."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run db/schema.sql and db/seed.sql."
  exit 1
fi
# Fail fast if seed.sql contains invalid Postgres escaping (\')
if grep -n "\\\\'" db/seed.sql >/dev/null; then
  echo "ERROR: db/seed.sql contains invalid Postgres escaping (\\')."
  echo "Use doubled single quotes instead: ''"
  echo "Offending lines:"
  grep -n "\\\\'" db/seed.sql | head -n 20
  exit 1
fi
psql "${DB_URL}" -f db/schema.sql -f db/seed.sql

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to validate seed output."
  exit 1
fi

duplicate_count=$(psql "${DB_URL}" -v ON_ERROR_STOP=1 -t -A <<'SQL'
with base as (
  select
    id,
    title,
    trim(split_part(coalesce(summary, ''), '.', 1)) as s1,
    trim(split_part(coalesce(summary, ''), '.', 2)) as s2
  from scenarios
),
normalized as (
  select
    id,
    title,
    lower(regexp_replace(s1, '\s+', ' ', 'g')) as n1,
    lower(regexp_replace(s2, '\s+', ' ', 'g')) as n2
  from base
)
select count(*)
from normalized
where n1 <> '' and n1 = n2;
SQL
)

if [[ "${duplicate_count}" -gt 0 ]]; then
  echo "Duplicate opening sentences found in scenario summaries:"
  psql "${DB_URL}" -v ON_ERROR_STOP=1 -t <<'SQL'
with base as (
  select
    id,
    title,
    trim(split_part(coalesce(summary, ''), '.', 1)) as s1,
    trim(split_part(coalesce(summary, ''), '.', 2)) as s2
  from scenarios
),
normalized as (
  select
    id,
    title,
    lower(regexp_replace(s1, '\s+', ' ', 'g')) as n1,
    lower(regexp_replace(s2, '\s+', ' ', 'g')) as n2
  from base
)
select id || ' | ' || title
from normalized
where n1 <> '' and n1 = n2
order by title;
SQL
  exit 1
fi
