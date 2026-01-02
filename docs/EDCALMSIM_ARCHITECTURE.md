# EDCalmSim Architecture

## Purpose
EDCalmSim is a scenario-based de-escalation simulation application.
Users select a scenario, start a simulation session, exchange chat turns,
and end the session to review outcomes and transcripts.

## Tech Stack
- Next.js (App Router) with TypeScript
- Supabase Cloud (Postgres via @supabase/supabase-js)
- No authentication initially (anonymous sessions only)

## Core Entities
### Scenario
Represents a training scenario available to users.
- id (uuid)
- title
- description
- difficulty
- tags
- is_published
- created_at

### Session
Represents one simulation run of a scenario.
- id (uuid)
- scenario_id (FK → scenarios.id)
- anon_id (uuid stored in localStorage)
- started_at
- ended_at
- turn_count
- outcome
- summary

### Turn
Represents a single chat exchange within a session.
- id (uuid)
- session_id (FK → sessions.id)
- role ('user' | 'coach' | 'system')
- content
- created_at

## Routes / Pages
- `/` — Scenario Library
- `/sim/[sessionId]` — Simulation Chat
- `/results/[sessionId]` — Session Results

## Core Flow
1. Load published scenarios
2. User starts a session → create Session row
3. User submits messages → create Turns
4. Coach/system responds
5. User ends session → persist outcome and summary
6. Show results page

## Phase 1 Constraints
- Anonymous usage only
- No role-based access control
- No LMS assumptions (courses, enrollments, SCORM, etc.)

## Future Phases (Out of Scope)
- Authentication
- LMS integration
- Scoring models
- AI-generated coaching
