export const SCENARIO_TYPES = [
  "LONG_WAIT_DELAY",
  "BOUNDARY_VIOLATION",
  "MISTRUST_OF_SYSTEM",
  "FEAR_DRIVEN_ANGER",
  "FAMILY_MEMBER_ESCALATION",
  "POLICY_VS_COMPASSION",
  "REPEATED_COMPLAINT_LOOP",
  "ESCALATE_TO_AUTHORITY",
  "DISRESPECTFUL_LANGUAGE",
  "LAST_CHANCE_INTERACTION"
] as const;

export type ScenarioType = (typeof SCENARIO_TYPES)[number];

export type ScenarioPersonaSeed = {
  actor_type?: "PATIENT" | "FAMILY_MEMBER";
  baseline_emotions?: string[];
  communication_style?: string;
  stressors?: string[];
  red_lines?: string[];
  calming_signals?: string[];
  success_criteria?: string[];
  failure_triggers?: string[];
};

export type ScenarioConstraints = {
  department_rules?: string[];
  prohibited_phrases?: string[];
  escalation_boundaries?: string[];
};

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type Scenario = {
  id: string;
  department_id: string | null;
  scenario_type: ScenarioType | null;
  title: string;
  summary: string | null;
  description: string | null;
  difficulty: string | null;
  tags: string[];
  persona_seed: ScenarioPersonaSeed | null;
  constraints_refs: ScenarioConstraints | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
};

export type Session = {
  id: string;
  scenario_id: string;
  department_id: string | null;
  scenario_type: ScenarioType | null;
  anon_id: string;
  started_at: string;
  ended_at: string | null;
  turn_count: number;
  outcome: string;
  summary: string | null;
  created_at: string;
};

export type Turn = {
  id: string;
  session_id: string;
  role: "user" | "coach" | "system" | "patient";
  content: string;
  coach_category: string | null;
  coach_tip: string | null;
  coach_rewrite: string | null;
  source: "ai" | "repaired" | "heuristic" | "user" | "system" | null;
  model: string | null;
  prompt_hash: string | null;
  created_at: string;
};

export type SessionMetrics = {
  session_id: string;
  empathy_score: number;
  clarity_score: number;
  boundary_score: number;
  escalation_level: number;
  updated_at: string;
};

export type TurnMetrics = {
  id: string;
  session_id: string;
  turn_id: string;
  empathy_delta: number;
  clarity_delta: number;
  boundary_delta: number;
  escalation_delta: number;
  reasons: (string | { metric: string; delta: number; rule: string })[] | null;
  created_at: string;
};

export type TurnMetricsDeltas = Pick<
  TurnMetrics,
  "empathy_delta" | "clarity_delta" | "boundary_delta" | "escalation_delta"
>;
