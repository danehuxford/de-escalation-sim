# EDCalmSims

Prototype Next.js (App Router) app for EDCalmSim.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Set Supabase credentials before running the app:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database seeding (dev)

Use a Postgres connection string from Supabase (e.g. Settings → Database → Connection string).

```bash
SUPABASE_DB_URL=your_supabase_db_url npm run db:seed
```

This script runs `db/schema.sql` and `db/seed.sql` and is blocked in production.

## Build and start

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```
