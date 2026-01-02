import type { TurnMetrics } from "./types";

export type CoachCategory =
  | "Escalation"
  | "Empathy"
  | "Boundary"
  | "Clarity"
  | "Neutral";

const COACH_TIPS: Record<CoachCategory, string> = {
  Escalation:
    "Lower intensity. Avoid commands like 'calm down' - use validation + options.",
  Empathy:
    "Lead with validation. Name the emotion + show you're listening before problem-solving.",
  Clarity: "Give a short next step with a timeframe and what you'll do.",
  Boundary:
    "Set limits calmly and pair them with what you can do ('I can't X, but I can Y').",
  Neutral: "Add validation and one clear next step."
};

const COACH_REWRITES: Record<CoachCategory, string> = {
  Escalation:
    "I can see this is really frustrating. I want to help. Let's take a breath - here are two options we can do next...",
  Empathy:
    "I understand this is upsetting. Thank you for telling me. I'm here with you.",
  Clarity:
    "Here's what will happen next: I'm going to [action]. I'll be back with an update in [time].",
  Boundary:
    "I can't [request], but what I can do is [helpful action] right now.",
  Neutral:
    "I hear you. Here's what I can do next: [action]. I'll update you in [time]."
};

const DELTA_PRIORITY: Array<{
  key: keyof TurnMetrics;
  category: CoachCategory;
  label: string;
}> = [
  { key: "escalation_delta", category: "Escalation", label: "Escalation" },
  { key: "empathy_delta", category: "Empathy", label: "Empathy" },
  { key: "boundary_delta", category: "Boundary", label: "Boundary" },
  { key: "clarity_delta", category: "Clarity", label: "Clarity" }
];

function findPrimaryDelta(turnMetrics: TurnMetrics) {
  let best = { delta: 0, category: "Empathy", label: "Empathy" as const };
  for (const candidate of DELTA_PRIORITY) {
    const delta = turnMetrics[candidate.key] ?? 0;
    const absDelta = Math.abs(delta);
    if (
      absDelta > Math.abs(best.delta) ||
      (absDelta === Math.abs(best.delta) && delta !== 0 && best.delta === 0)
    ) {
      best = { delta, category: candidate.category, label: candidate.label };
    }
  }
  if (best.delta === 0) {
    return null;
  }
  return best;
}

function buildDeltaBadges(turnMetrics: TurnMetrics): string {
  const deltas = [
    { label: "ΔE", value: turnMetrics.empathy_delta ?? 0 },
    { label: "ΔC", value: turnMetrics.clarity_delta ?? 0 },
    { label: "ΔB", value: turnMetrics.boundary_delta ?? 0 },
    { label: "ΔEsc", value: turnMetrics.escalation_delta ?? 0 }
  ];
  const nonZero = deltas.filter((delta) => delta.value !== 0);
  const selected = nonZero.length > 0 ? nonZero : deltas;
  return selected
    .map((delta) => `${delta.label}:${delta.value >= 0 ? "+" : ""}${delta.value}`)
    .join(" ");
}

function findReasonForMetric(
  reasons: TurnMetrics["reasons"],
  metricKey: string
): string | null {
  if (!Array.isArray(reasons)) {
    return null;
  }
  const lowerMetric = metricKey.toLowerCase();
  const match = reasons.find((reason) => {
    if (typeof reason === "string") {
      return reason.startsWith(`${lowerMetric}:`);
    }
    return reason.metric.toLowerCase() === lowerMetric;
  });
  if (!match) {
    return null;
  }
  if (typeof match === "string") {
    return match;
  }
  const sign = match.delta >= 0 ? "+" : "";
  return `${match.metric}:${sign}${match.delta} ${match.rule}`;
}

function getNextStepPrompt(userTurnCount: number): string {
  if (userTurnCount <= 2) {
    return "Next step: ask one clarifying question.";
  }
  if (userTurnCount <= 4) {
    return "Next step: offer two options and a timeframe.";
  }
  return "Next step: summarize the agreement and confirm the next update.";
}

export function buildCoachResponse(
  turnMetrics: TurnMetrics,
  userTurnCount: number
): {
  category: CoachCategory;
  tip: string;
  rewrite: string;
  nextStep: string;
  content: string;
} {
  const primaryDelta = findPrimaryDelta(turnMetrics);
  const category = primaryDelta ? primaryDelta.category : "Neutral";
  const tip = COACH_TIPS[category];
  const rewrite = COACH_REWRITES[category];
  const nextStep = getNextStepPrompt(userTurnCount);
  const deltaBadges = buildDeltaBadges(turnMetrics);
  const why = primaryDelta
    ? findReasonForMetric(turnMetrics.reasons, primaryDelta.label)
    : "No scoring signals detected; try adding validation + one clear next step.";
  const content = [
    `Category: ${primaryDelta ? primaryDelta.label : "Neutral"} (${deltaBadges})`,
    `Why: ${why ?? "delta based on scoring rules"}`,
    `Tip: ${tip}`,
    `Rewrite: ${rewrite}`,
    nextStep
  ].join("\n");

  return { category, tip, rewrite, nextStep, content };
}
