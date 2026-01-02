import { scoringConfig } from "./scoringConfig";
import { getEffectiveRubric, type CoachMeHint, type RubricConfig } from "./rubric";
import type { TurnMetricsDeltas } from "./types";

type TurnMetricsResult = {
  deltas: TurnMetricsDeltas;
  reasons: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function findFirstMatch(text: string, phrases: string[]): string | null {
  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

function countLetters(text: string): { letters: number; uppercase: number } {
  let letters = 0;
  let uppercase = 0;

  for (const char of text) {
    if (char >= "A" && char <= "Z") {
      letters += 1;
      uppercase += 1;
    } else if (char >= "a" && char <= "z") {
      letters += 1;
    }
  }

  return { letters, uppercase };
}

function getWordCount(text: string): number {
  const matches = text.match(/[A-Za-z0-9]+/g);
  return matches ? matches.length : 0;
}

function hasAllCapsSignal(text: string): boolean {
  const { letters, uppercase } = countLetters(text);
  const threshold = scoringConfig.escalation.allCapsThreshold;
  if (letters < threshold.letters) {
    return false;
  }
  return uppercase / letters >= threshold.ratio;
}

function addReason(reasons: string[], reason: string, maxReasons: number) {
  if (reasons.length >= maxReasons) {
    return;
  }
  reasons.push(reason);
}

function formatReason(metric: string, delta: number, rule: string): string {
  return `${metric}:${delta >= 0 ? "+" : ""}${delta} ${rule}`;
}

export function computeTurnMetrics(
  content: string,
  options?: {
    rubric?: RubricConfig;
    coachMeHint?: CoachMeHint | null;
    previousUserContent?: string | null;
  }
): TurnMetricsResult {
  const rubric = options?.rubric ?? getEffectiveRubric();
  const textLower = content.toLowerCase();
  const wordCount = getWordCount(content);
  const reasons: string[] = [];
  const maxReasons = 8;

  const profanityPhrase = findFirstMatch(textLower, scoringConfig.profanity);
  const profanityPresent = Boolean(profanityPhrase);
  const hasAllCaps = hasAllCapsSignal(content);

  let empathyDelta = 0;
  const empathyStrongPhrase = findFirstMatch(
    textLower,
    scoringConfig.empathy.phrases.strong
  );
  if (empathyStrongPhrase) {
    empathyDelta += scoringConfig.empathy.deltas.strong;
    addReason(
      reasons,
      formatReason("empathy", scoringConfig.empathy.deltas.strong, `phrase:${empathyStrongPhrase}`),
      maxReasons
    );
  }

  const empathyCourtesyPhrase = findFirstMatch(
    textLower,
    scoringConfig.empathy.phrases.courtesy
  );
  if (empathyCourtesyPhrase) {
    empathyDelta += scoringConfig.empathy.deltas.courtesy;
    addReason(
      reasons,
      formatReason("empathy", scoringConfig.empathy.deltas.courtesy, `phrase:${empathyCourtesyPhrase}`),
      maxReasons
    );
  }

  const empathyNegativePhrase = findFirstMatch(
    textLower,
    scoringConfig.empathy.phrases.negative
  );
  if (empathyNegativePhrase) {
    empathyDelta += scoringConfig.empathy.deltas.negative;
    addReason(
      reasons,
      formatReason("empathy", scoringConfig.empathy.deltas.negative, `phrase:${empathyNegativePhrase}`),
      maxReasons
    );
  }

  const empathyTersePhrase = findFirstMatch(
    textLower,
    scoringConfig.empathy.phrases.terse
  );
  if (empathyTersePhrase) {
    empathyDelta += scoringConfig.empathy.deltas.terse;
    addReason(
      reasons,
      formatReason("empathy", scoringConfig.empathy.deltas.terse, `phrase:${empathyTersePhrase}`),
      maxReasons
    );
  }

  if (profanityPresent) {
    empathyDelta += scoringConfig.empathy.deltas.profanity;
    addReason(
      reasons,
      formatReason(
        "empathy",
        scoringConfig.empathy.deltas.profanity,
        `profanity:${profanityPhrase}`
      ),
      maxReasons
    );
  }

  empathyDelta = clamp(
    empathyDelta,
    scoringConfig.empathy.clamp.min,
    scoringConfig.empathy.clamp.max
  );

  let clarityDelta = 0;
  const clarityStructuredPhrase = findFirstMatch(
    textLower,
    scoringConfig.clarity.phrases.structured
  );
  if (clarityStructuredPhrase) {
    clarityDelta += scoringConfig.clarity.deltas.structured;
    addReason(
      reasons,
      formatReason("clarity", scoringConfig.clarity.deltas.structured, `phrase:${clarityStructuredPhrase}`),
      maxReasons
    );
  }

  const timeRegex = new RegExp(scoringConfig.clarity.timeEstimateRegex, "i");
  if (timeRegex.test(textLower)) {
    clarityDelta += scoringConfig.clarity.deltas.timeEstimate;
    addReason(
      reasons,
      formatReason("clarity", scoringConfig.clarity.deltas.timeEstimate, "time_estimate"),
      maxReasons
    );
  }

  if (wordCount > scoringConfig.clarity.longMessageThreshold) {
    clarityDelta += scoringConfig.clarity.deltas.longMessage;
    addReason(
      reasons,
      formatReason("clarity", scoringConfig.clarity.deltas.longMessage, "long_message"),
      maxReasons
    );
  }

  if ((content.match(/\?/g) ?? []).length >= scoringConfig.clarity.manyQuestionsThreshold) {
    clarityDelta += scoringConfig.clarity.deltas.manyQuestions;
    addReason(
      reasons,
      formatReason("clarity", scoringConfig.clarity.deltas.manyQuestions, "many_questions"),
      maxReasons
    );
  }

  clarityDelta = clamp(
    clarityDelta,
    scoringConfig.clarity.clamp.min,
    scoringConfig.clarity.clamp.max
  );

  let boundaryDelta = 0;
  const boundaryFirmPhrase = findFirstMatch(
    textLower,
    scoringConfig.boundary.phrases.firm
  );
  if (boundaryFirmPhrase) {
    boundaryDelta += scoringConfig.boundary.deltas.firm;
    addReason(
      reasons,
      formatReason("boundary", scoringConfig.boundary.deltas.firm, `phrase:${boundaryFirmPhrase}`),
      maxReasons
    );
  }

  const boundaryOptionsPhrase = findFirstMatch(
    textLower,
    scoringConfig.boundary.phrases.options
  );
  if (boundaryOptionsPhrase) {
    boundaryDelta += scoringConfig.boundary.deltas.options;
    addReason(
      reasons,
      formatReason("boundary", scoringConfig.boundary.deltas.options, `phrase:${boundaryOptionsPhrase}`),
      maxReasons
    );
  }

  const boundaryThreatPhrase = findFirstMatch(
    textLower,
    scoringConfig.boundary.phrases.threats
  );
  if (boundaryThreatPhrase) {
    boundaryDelta += scoringConfig.boundary.deltas.threats;
    addReason(
      reasons,
      formatReason(
        "boundary",
        scoringConfig.boundary.deltas.threats,
        `phrase:${boundaryThreatPhrase}`
      ),
      maxReasons
    );
  }

  if (
    textLower.includes(scoringConfig.boundary.callSecurityPhrase) &&
    !textLower.includes("for safety")
  ) {
    boundaryDelta += scoringConfig.boundary.deltas.callSecurity;
    addReason(
      reasons,
      formatReason("boundary", scoringConfig.boundary.deltas.callSecurity, "phrase:i'll call security"),
      maxReasons
    );
  }

  boundaryDelta = clamp(
    boundaryDelta,
    scoringConfig.boundary.clamp.min,
    scoringConfig.boundary.clamp.max
  );

  let escalationDelta = 0;
  const escalationPhrase = findFirstMatch(
    textLower,
    scoringConfig.escalation.phrases.escalation
  );
  const escalationTersePhrase = findFirstMatch(
    textLower,
    scoringConfig.escalation.phrases.terse
  );
  const demandPhrase = findFirstMatch(
    textLower,
    scoringConfig.escalation.phrases.demands
  );
  const calmingPhrase = findFirstMatch(
    textLower,
    scoringConfig.escalation.phrases.calming
  );

  const escalationSignal =
    profanityPresent ||
    hasAllCaps ||
    Boolean(escalationPhrase) ||
    Boolean(escalationTersePhrase) ||
    (Boolean(demandPhrase) && !textLower.includes("please"));

  if (escalationSignal) {
    escalationDelta += scoringConfig.escalation.deltas.escalation;
    if (profanityPresent) {
      addReason(
        reasons,
        formatReason(
          "escalation",
          scoringConfig.escalation.deltas.escalation,
          `profanity:${profanityPhrase}`
        ),
        maxReasons
      );
    } else if (hasAllCaps) {
      addReason(
        reasons,
        formatReason("escalation", scoringConfig.escalation.deltas.escalation, "all_caps"),
        maxReasons
      );
    } else if (escalationTersePhrase) {
      addReason(
        reasons,
        formatReason(
          "escalation",
          scoringConfig.escalation.deltas.escalation,
          `phrase:${escalationTersePhrase}`
        ),
        maxReasons
      );
    } else if (escalationPhrase) {
      addReason(
        reasons,
        formatReason("escalation", scoringConfig.escalation.deltas.escalation, `phrase:${escalationPhrase}`),
        maxReasons
      );
    } else if (demandPhrase) {
      addReason(
        reasons,
        formatReason("escalation", scoringConfig.escalation.deltas.escalation, `phrase:${demandPhrase}`),
        maxReasons
      );
    }
  }

  if (calmingPhrase) {
    escalationDelta += scoringConfig.escalation.deltas.calming;
    addReason(
      reasons,
      formatReason("escalation", scoringConfig.escalation.deltas.calming, `phrase:${calmingPhrase}`),
      maxReasons
    );
  }

  escalationDelta = clamp(
    escalationDelta,
    scoringConfig.escalation.clamp.min,
    scoringConfig.escalation.clamp.max
  );

  const positiveMetrics = [
    empathyDelta > 0,
    clarityDelta > 0,
    boundaryDelta > 0
  ].filter(Boolean).length;
  if (rubric.profile === "training" && positiveMetrics >= 2) {
    const bonus =
      positiveMetrics >= 3 ? rubric.comboBonus.three : rubric.comboBonus.two;
    if (bonus > 0 && rubric.comboBonus.applyTo === "escalation") {
      escalationDelta -= bonus;
      addReason(reasons, `combo_bonus:${-bonus}`, maxReasons);
    }
  }

  if (rubric.profile === "training" && rubric.followThrough.enabled) {
    const previous = options?.previousUserContent?.toLowerCase() ?? "";
    const promised =
      /(i'|i )?ll.*(back|update)/.test(previous) ||
      /(\d{1,2})\s?(min|mins|minutes)/.test(previous);
    const followed =
      textLower.includes("i'm back") ||
      textLower.includes("i am back") ||
      textLower.includes("as promised") ||
      textLower.includes("update");
    if (promised && followed) {
      clarityDelta += rubric.followThrough.clarity;
      escalationDelta -= rubric.followThrough.escalation;
      addReason(
        reasons,
        `follow_through:+${rubric.followThrough.clarity}`,
        maxReasons
      );
    }
  }

  if (rubric.profile === "training" && options?.coachMeHint) {
    const hint = options.coachMeHint;
    const strengthValue =
      hint.strength === 1
        ? rubric.strengthDeltas.light
        : hint.strength === 2
        ? rubric.strengthDeltas.medium
        : rubric.strengthDeltas.strong;
    const applyHint = (delta: number) => {
      if (delta <= 0) {
        return delta;
      }
      if (hint.suggestionId === "light") {
        return Math.min(delta, strengthValue);
      }
      return Math.max(delta, strengthValue);
    };
    if (hint.metric === "empathy") {
      empathyDelta = applyHint(empathyDelta);
      addReason(reasons, `coach_me_hint:empathy:${strengthValue}`, maxReasons);
    }
    if (hint.metric === "clarity") {
      clarityDelta = applyHint(clarityDelta);
      addReason(reasons, `coach_me_hint:clarity:${strengthValue}`, maxReasons);
    }
    if (hint.metric === "boundaries") {
      boundaryDelta = applyHint(boundaryDelta);
      addReason(reasons, `coach_me_hint:boundaries:${strengthValue}`, maxReasons);
    }
    if (hint.metric === "calmness" || hint.metric === "escalation") {
      const improved = escalationDelta < 0;
      if (improved) {
        escalationDelta = -Math.max(Math.abs(escalationDelta), strengthValue);
        addReason(reasons, `coach_me_hint:calmness:-${strengthValue}`, maxReasons);
      }
    }
  }

  const scaleByProfile = (delta: number) => {
    if (rubric.profile === "easy") {
      return delta * 10;
    }
    if (rubric.profile === "medium") {
      return delta * 5;
    }
    if (rubric.profile === "hard") {
      return delta * 1;
    }
    return delta;
  };

  if (rubric.profile !== "strict") {
    empathyDelta = clamp(
      scaleByProfile(empathyDelta),
      rubric.perTurnClamp.min,
      rubric.perTurnClamp.max
    );
    clarityDelta = clamp(
      scaleByProfile(clarityDelta),
      rubric.perTurnClamp.min,
      rubric.perTurnClamp.max
    );
    boundaryDelta = clamp(
      scaleByProfile(boundaryDelta),
      rubric.perTurnClamp.min,
      rubric.perTurnClamp.max
    );
    escalationDelta = clamp(
      scaleByProfile(escalationDelta),
      rubric.perTurnClamp.min,
      rubric.perTurnClamp.max
    );
  }

  return {
    deltas: {
      empathy_delta: empathyDelta,
      clarity_delta: clarityDelta,
      boundary_delta: boundaryDelta,
      escalation_delta: escalationDelta
    },
    reasons
  };
}

export function applySessionMetricDeltas(
  metrics: {
    empathy_score: number;
    clarity_score: number;
    boundary_score: number;
    escalation_level: number;
  },
  deltas: TurnMetricsDeltas
) {
  return {
    empathy_score: clamp(
      metrics.empathy_score + deltas.empathy_delta,
      scoringConfig.sessionClamps.empathy.min,
      scoringConfig.sessionClamps.empathy.max
    ),
    clarity_score: clamp(
      metrics.clarity_score + deltas.clarity_delta,
      scoringConfig.sessionClamps.clarity.min,
      scoringConfig.sessionClamps.clarity.max
    ),
    boundary_score: clamp(
      metrics.boundary_score + deltas.boundary_delta,
      scoringConfig.sessionClamps.boundary.min,
      scoringConfig.sessionClamps.boundary.max
    ),
    escalation_level: clamp(
      metrics.escalation_level + deltas.escalation_delta,
      scoringConfig.sessionClamps.escalation.min,
      scoringConfig.sessionClamps.escalation.max
    )
  };
}
