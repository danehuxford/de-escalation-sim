import type {
  Department,
  Scenario,
  ScenarioConstraints,
  ScenarioPersonaSeed,
  ScenarioType,
  Session,
  SessionMetrics,
  Turn
} from "./types";

export type DeesRuntimePrompt = {
  meta: {
    schema_version: "v1";
    simulation_id: string;
    session_id: string;
    turn_index: number;
    timestamp_iso: string;
    language: string;
  };
  environment: {
    department: {
      id: string | null;
      name: string | null;
      code: string | null;
      description: string | null;
    };
    location_context: string | null;
    time_context: string | null;
  };
  learner: {
    role: string;
  };
  scenario: {
    scenario_id: string;
    scenario_type: ScenarioType | "UNSPECIFIED";
    title: string;
    summary: string | null;
    objective_skills: string[];
    success_criteria: string[];
    failure_triggers: string[];
  };
  persona: {
    actor_type: "PATIENT" | "FAMILY_MEMBER";
    communication_style: string;
    stressors: string[];
    red_lines: string[];
    calming_signals: string[];
  };
  state: {
    escalation_level: number;
    emotions: string[];
    loop_control: {
      primary_complaint: string;
      times_repeated: number;
      must_progress_next_turn: boolean;
    };
    memory: {
      learner_mistakes_so_far: string[];
      learner_strengths_so_far: string[];
    };
  };
  constraints: {
    global_safety: {
      no_medical_advice: boolean;
      no_diagnosis: boolean;
      no_medication_instructions: boolean;
      no_violence_roleplay_or_coaching: boolean;
      no_slurs_or_sexual_content: boolean;
    };
    department_rules: string[];
    prohibited_phrases: string[];
    escalation_boundaries: string[];
  };
  conversation: {
    summary_so_far: string;
    recent_turns: Array<{
      role: string;
      content: string;
      created_at: string | null;
    }>;
  };
  response_instructions: {
    output_mode: "PATIENT_UTTERANCE_ONLY";
    length: {
      min_sentences: number;
      max_sentences: number;
    };
    deescalation_dynamics: string[];
  };
};

type BuildPromptOptions = {
  session: Session;
  scenario: Scenario;
  department: Department | null;
  turns: Turn[];
  metrics: SessionMetrics | null;
  turnIndex: number;
  recentTurnLimit?: number;
  summaryMaxChars?: number;
  learnerRole?: string;
  escalationLevelOverride?: number | null;
};

const DEFAULT_PROHIBITED_PHRASES = [
  "You should sue",
  "Take these meds",
  "I can diagnose you"
];

const DEFAULT_DEESCALATION_DYNAMICS = [
  "Respond as the patient or family member only.",
  "Keep the tone realistic and grounded in the scenario stressors.",
  "Do not coach or instruct the learner."
];

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function ensureUniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (!value || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function clampEscalation(level: number): number {
  if (Number.isNaN(level)) {
    return 2;
  }
  return Math.max(1, Math.min(5, Math.round(level)));
}

function buildConversationSummary(
  turns: Turn[],
  maxChars: number
): string {
  if (turns.length === 0) {
    return "No conversation yet.";
  }
  const summary = turns
    .slice(-6)
    .map((turn) => {
      const role = turn.role.toUpperCase();
      return `${role}: ${turn.content}`;
    })
    .join(" ");
  return summary.length > maxChars ? `${summary.slice(0, maxChars)}...` : summary;
}

function getPersonaSeed(scenario: Scenario): ScenarioPersonaSeed | null {
  if (!scenario.persona_seed || typeof scenario.persona_seed !== "object") {
    return null;
  }
  return scenario.persona_seed as ScenarioPersonaSeed;
}

function getConstraintsSeed(scenario: Scenario): ScenarioConstraints | null {
  if (!scenario.constraints_refs || typeof scenario.constraints_refs !== "object") {
    return null;
  }
  return scenario.constraints_refs as ScenarioConstraints;
}

function buildFallbackDepartmentRules(department: Department | null): string[] {
  if (!department?.code) {
    return ["Follow local policy and remain professional."];
  }
  if (department.code === "ED") {
    return ["Follow ED escalation policy and stay calm."];
  }
  if (department.code === "ICU") {
    return ["Respect ICU quiet hours and visitor guidelines."];
  }
  if (department.code === "MEDSURG") {
    return ["Respect rounding schedules and care priorities."];
  }
  if (department.code === "BH") {
    return ["Use trauma-informed language and maintain safety boundaries."];
  }
  if (department.code === "LD") {
    return ["Prioritize maternal-fetal safety and privacy."];
  }
  if (department.code === "NICU") {
    return ["Limit stimulation and follow infection control guidance."];
  }
  if (department.code === "REG") {
    return ["Protect privacy and verify identity before sharing details."];
  }
  if (department.code === "UC") {
    return ["Clarify urgent care scope and referral policy."];
  }
  if (department.code === "SECURITY") {
    return ["Use calm directives and least restrictive intervention."];
  }
  if (department.code === "BILLING") {
    return ["Clarify billing policy without making promises."];
  }
  return ["Follow department policy and remain professional."];
}

function buildPersona(scenario: Scenario): DeesRuntimePrompt["persona"] {
  const seed = getPersonaSeed(scenario);
  const actorType =
    seed?.actor_type === "FAMILY_MEMBER" ? "FAMILY_MEMBER" : "PATIENT";
  const communicationStyle =
    typeof seed?.communication_style === "string"
      ? seed.communication_style
      : "Stressed, direct, and emotionally reactive.";
  const stressors = ensureStringArray(seed?.stressors);
  const redLines = ensureStringArray(seed?.red_lines);
  const calmingSignals = ensureStringArray(seed?.calming_signals);
  return {
    actor_type: actorType,
    communication_style: communicationStyle,
    stressors,
    red_lines: redLines,
    calming_signals: calmingSignals
  };
}

function buildEmotions(
  escalationLevel: number,
  scenario: Scenario
): string[] {
  const seed = getPersonaSeed(scenario);
  const baseline = ensureStringArray(seed?.baseline_emotions);
  if (baseline.length > 0) {
    return baseline;
  }
  if (escalationLevel >= 4) {
    return ["angry", "overwhelmed", "impatient"];
  }
  if (escalationLevel === 3) {
    return ["frustrated", "anxious"];
  }
  return ["concerned", "tense"];
}

function buildConstraints(
  department: Department | null,
  scenario: Scenario
): Pick<
  DeesRuntimePrompt["constraints"],
  "department_rules" | "prohibited_phrases" | "escalation_boundaries"
> {
  const constraintsSeed = getConstraintsSeed(scenario);
  const departmentRulesSeed = ensureStringArray(constraintsSeed?.department_rules);
  const departmentRules =
    departmentRulesSeed.length > 0
      ? departmentRulesSeed
      : buildFallbackDepartmentRules(department);
  const prohibitedSeed = ensureStringArray(constraintsSeed?.prohibited_phrases);
  const prohibitedPhrases = ensureUniqueStrings([
    ...prohibitedSeed,
    ...DEFAULT_PROHIBITED_PHRASES
  ]);
  const escalationBoundaries = ensureStringArray(
    constraintsSeed?.escalation_boundaries
  );

  return {
    department_rules: departmentRules,
    prohibited_phrases: prohibitedPhrases,
    escalation_boundaries: escalationBoundaries
  };
}

function buildScenarioSuccessCriteria(scenario: Scenario): string[] {
  const seed = getPersonaSeed(scenario);
  const seedCriteria = ensureStringArray(seed?.success_criteria);
  if (seedCriteria.length > 0) {
    return seedCriteria;
  }
  return [
    "Learner de-escalates without escalating conflict.",
    "Learner communicates a clear next step."
  ];
}

function buildScenarioFailureTriggers(scenario: Scenario): string[] {
  const seed = getPersonaSeed(scenario);
  const seedTriggers = ensureStringArray(seed?.failure_triggers);
  if (seedTriggers.length > 0) {
    return seedTriggers;
  }
  return ["Learner escalates tone", "Learner dismisses concerns"];
}

export function buildDeesRuntimePrompt({
  session,
  scenario,
  department,
  turns,
  metrics,
  turnIndex,
  recentTurnLimit = 8,
  summaryMaxChars = 420,
  learnerRole = "staff",
  escalationLevelOverride = null
}: BuildPromptOptions): DeesRuntimePrompt {
  const escalationLevel = clampEscalation(
    escalationLevelOverride ?? metrics?.escalation_level ?? 2
  );
  const summarySoFar = buildConversationSummary(turns, summaryMaxChars);
  const recentTurns = turns.slice(-recentTurnLimit).map((turn) => ({
    role: turn.role,
    content: turn.content,
    created_at: turn.created_at ?? null
  }));
  const primaryComplaint =
    scenario.summary ??
    scenario.description ??
    scenario.title ??
    "Primary concern not specified.";
  const objectiveSkills = scenario.tags ?? [];
  return {
    meta: {
      schema_version: "v1",
      simulation_id: session.id,
      session_id: session.id,
      turn_index: turnIndex,
      timestamp_iso: new Date().toISOString(),
      language: "en"
    },
    environment: {
      department: {
        id: department?.id ?? null,
        name: department?.name ?? null,
        code: department?.code ?? null,
        description: department?.description ?? null
      },
      location_context: null,
      time_context: null
    },
    learner: {
      role: learnerRole
    },
    scenario: {
      scenario_id: scenario.id,
      scenario_type: scenario.scenario_type ?? "UNSPECIFIED",
      title: scenario.title,
      summary: scenario.summary ?? scenario.description ?? null,
      objective_skills: objectiveSkills,
      success_criteria: buildScenarioSuccessCriteria(scenario),
      failure_triggers: buildScenarioFailureTriggers(scenario)
    },
    persona: buildPersona(scenario),
    state: {
      escalation_level: escalationLevel,
      emotions: buildEmotions(escalationLevel, scenario),
      loop_control: {
        primary_complaint: primaryComplaint,
        times_repeated: 0,
        must_progress_next_turn: false
      },
      memory: {
        learner_mistakes_so_far: [],
        learner_strengths_so_far: []
      }
    },
    constraints: {
      global_safety: {
        no_medical_advice: true,
        no_diagnosis: true,
        no_medication_instructions: true,
        no_violence_roleplay_or_coaching: true,
        no_slurs_or_sexual_content: true
      },
      ...buildConstraints(department, scenario)
    },
    conversation: {
      summary_so_far: summarySoFar,
      recent_turns: recentTurns
    },
    response_instructions: {
      output_mode: "PATIENT_UTTERANCE_ONLY",
      length: {
        min_sentences: 1,
        max_sentences: 3
      },
      deescalation_dynamics: DEFAULT_DEESCALATION_DYNAMICS
    }
  };
}
