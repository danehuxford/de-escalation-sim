# Coding Rules (EDCalmSim)

## General
- TypeScript strict, no `any` unless unavoidable.
- Keep components small and readable.
- Prefer simple, explicit code over clever abstractions.

## Project Structure
- `app/` for routes (Next.js App Router)
- `lib/` for shared utilities (supabase client, anon id, types)
- `components/` for UI components

## Supabase Usage
- Use `@supabase/supabase-js` only.
- Create a single client in `lib/supabaseClient.ts`.
- All DB reads/writes should live in `lib/db/*.ts` helpers when they grow beyond trivial usage.
- Handle loading and error states in UI.

## Anonymous Identity
- Use `anon_id` stored in localStorage as a UUID.
- Never assume auth; do not use `supabase.auth` in Phase 1.

## Data Rules
- Scenario list: only show `is_published = true`.
- Sessions are created with `outcome='In Progress'` and `turn_count=0`.
- Increment `turn_count` only for user turns.

## UI/UX
- Keep chat layout stable (avoid auto-scroll surprises).
- Always show clear “Start”, “Send”, and “End Session” actions.

# Standing Codex Rule

All Codex prompts MUST begin with the exact instruction:

"Follow docs/EDCALMSIM_ARCHITECTURE.md and docs/CODING_RULES.md exactly."

Any other architecture documents (e.g., LMS_ARCHITECTURE.md) are deprecated
and must not be referenced or inferred.
## Change Artifacts (MANDATORY)

For every implementation change (code, schema, or UI):

1. A Markdown change summary MUST be created:
   - Location: docs/comments/
   - Filename format: YYYY-MM-DD_HHMM_change-summary.md
   - Contents must include:
     - Summary of changes
     - Files modified (with brief description)
     - Any schema changes
     - Any behavior changes
     - Any follow-up notes

2. A ZIP archive of all changed files MUST be created:
   - Location: docs/comments/
   - Filename format: YYYY-MM-DD_HHMM_changed-files.zip
   - ZIP must include ONLY files modified in that change

3. On the *next* implementation task:
   - All existing .md and .zip files in docs/comments/
     MUST be moved to docs/comments/archive/
   - Archive folder must preserve filenames and timestamps

4. No implementation is considered complete unless:
   - The Markdown summary exists
   - The ZIP archive exists
   - Previous artifacts have been archived

Failure to follow this rule is a blocking error.

## Change Documentation & Archiving (MANDATORY)

Every code change made in response to a prompt MUST produce artifacts as follows:

### On Every Update
After implementing any code change (including refactors, fixes, or new features):

1. Create a Markdown file describing the changes:
   - Location: docs/comments/
   - Filename format: YYYY-MM-DD_HHMM_change-summary.md
   - Content MUST include:
     - Summary of changes
     - Files modified
     - Rationale for changes
     - Any assumptions or known limitations

2. Create a ZIP archive of all modified files:
   - Location: docs/comments/
   - Filename format: YYYY-MM-DD_HHMM_changed-files.zip
   - Include ONLY files changed in that update

### Archiving Rule
Before processing the NEXT prompt that results in code changes:

- Move all existing files in `docs/comments/` (except the archive folder) into:
  - `docs/comments/archive/`

- Do NOT overwrite archived files.
- The archive is append-only.

### Enforcement
- If an update cannot produce both the Markdown summary and ZIP archive, the update is considered INCOMPLETE.
- Codex MUST NOT claim work is finished until these artifacts exist.
## Completion Checklist

A task is ONLY complete when ALL are true:
- [ ] Code changes implemented
- [ ] Application runs without errors
- [ ] Change summary Markdown exists in docs/comments/
- [ ] ZIP of changed files exists in docs/comments/
- [ ] Previous artifacts archived (if applicable)
