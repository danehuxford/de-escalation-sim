-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Scenarios (your library)
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  scenario_type text not null check (
    scenario_type in (
      'LONG_WAIT_DELAY',
      'BOUNDARY_VIOLATION',
      'MISTRUST_OF_SYSTEM',
      'FEAR_DRIVEN_ANGER',
      'FAMILY_MEMBER_ESCALATION',
      'POLICY_VS_COMPASSION',
      'REPEATED_COMPLAINT_LOOP',
      'ESCALATE_TO_AUTHORITY',
      'DISRESPECTFUL_LANGUAGE',
      'LAST_CHANCE_INTERACTION'
    )
  ),
  title text not null,
  summary text,
  description text,
  difficulty text,
  tags text[] default '{}',
  persona_seed jsonb,
  constraints_refs jsonb,
  is_active boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sessions (one run-through of a scenario)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  scenario_type text not null check (
    scenario_type in (
      'LONG_WAIT_DELAY',
      'BOUNDARY_VIOLATION',
      'MISTRUST_OF_SYSTEM',
      'FEAR_DRIVEN_ANGER',
      'FAMILY_MEMBER_ESCALATION',
      'POLICY_VS_COMPASSION',
      'REPEATED_COMPLAINT_LOOP',
      'ESCALATE_TO_AUTHORITY',
      'DISRESPECTFUL_LANGUAGE',
      'LAST_CHANCE_INTERACTION'
    )
  ),
  anon_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  turn_count int not null default 0,
  outcome text not null default 'In Progress',
  summary text,
  created_at timestamptz not null default now()
);

-- Turns (chat messages)
create table if not exists turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user','coach','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_scenario_id on sessions(scenario_id);
create index if not exists idx_sessions_department_id on sessions(department_id);
create index if not exists idx_sessions_anon_id on sessions(anon_id);
create index if not exists idx_scenarios_department_id on scenarios(department_id);
create index if not exists idx_turns_session_id on turns(session_id);
