create table if not exists session_metrics (
  session_id uuid primary key references sessions(id) on delete cascade,
  empathy_score int not null default 50,
  clarity_score int not null default 50,
  boundary_score int not null default 50,
  escalation_level int not null default 2,
  updated_at timestamptz not null default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists turn_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  turn_id uuid not null references turns(id) on delete cascade,
  empathy_delta int not null default 0,
  clarity_delta int not null default 0,
  boundary_delta int not null default 0,
  escalation_delta int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_turn_metrics_session_id on turn_metrics(session_id);
create index if not exists idx_turn_metrics_turn_id on turn_metrics(turn_id);

alter table turn_metrics
  add column if not exists reasons jsonb;

alter table turns
  add column if not exists coach_category text,
  add column if not exists coach_tip text,
  add column if not exists coach_rewrite text,
  add column if not exists source text,
  add column if not exists model text,
  add column if not exists prompt_hash text;

alter table scenarios
  add column if not exists department_id uuid references departments(id) on delete cascade,
  add column if not exists scenario_type text,
  add column if not exists summary text,
  add column if not exists persona_seed jsonb,
  add column if not exists constraints_refs jsonb,
  add column if not exists is_active boolean not null default true;

alter table sessions
  add column if not exists department_id uuid references departments(id) on delete cascade,
  add column if not exists scenario_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'turns_source_check'
  ) then
    alter table turns
      add constraint turns_source_check
      check (source in ('ai', 'repaired', 'heuristic', 'user', 'system'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'scenarios_scenario_type_check'
  ) then
    alter table scenarios
      drop constraint scenarios_scenario_type_check;
  end if;

  alter table scenarios
    add constraint scenarios_scenario_type_check
    check (
      scenario_type is null
      or scenario_type in (
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
    );
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'sessions_scenario_type_check'
  ) then
    alter table sessions
      drop constraint sessions_scenario_type_check;
  end if;

  alter table sessions
    add constraint sessions_scenario_type_check
    check (
      scenario_type is null
      or scenario_type in (
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
    );
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'scenarios'
      and column_name = 'constraints_refs'
      and udt_name = '_text'
  ) then
    alter table scenarios
      alter column constraints_refs type jsonb
      using to_jsonb(constraints_refs);
  end if;
end $$;

create index if not exists idx_sessions_department_id on sessions(department_id);
create index if not exists idx_scenarios_department_id on scenarios(department_id);
