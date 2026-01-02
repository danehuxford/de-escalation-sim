export type RubricProfile =
  | "strict"
  | "training"
  | "easy"
  | "medium"
  | "hard";

export type CoachMeHint = {
  metric: "empathy" | "clarity" | "boundaries" | "calmness" | "escalation";
  strength: 1 | 2 | 3;
  suggestionId: "light" | "medium" | "strong";
};

export type RubricConfig = {
  profile: RubricProfile;
  strengthDeltas: {
    light: number;
    medium: number;
    strong: number;
  };
  comboBonus: {
    two: number;
    three: number;
    applyTo: "escalation";
  };
  perTurnClamp: {
    min: number;
    max: number;
  };
  followThrough: {
    enabled: boolean;
    clarity: number;
    escalation: number;
  };
};

const baseDefaults: RubricConfig = {
  profile: "strict",
  strengthDeltas: {
    light: 1,
    medium: 2,
    strong: 3
  },
  comboBonus: {
    two: 1,
    three: 2,
    applyTo: "escalation"
  },
  perTurnClamp: {
    min: -5,
    max: 5
  },
  followThrough: {
    enabled: false,
    clarity: 1,
    escalation: 1
  }
};

const profileDefaults: Record<RubricProfile, Partial<RubricConfig>> = {
  strict: {},
  training: {
    perTurnClamp: { min: -3, max: 3 },
    followThrough: { enabled: true, clarity: 1, escalation: 1 }
  },
  easy: {
    perTurnClamp: { min: -50, max: 50 }
  },
  medium: {
    perTurnClamp: { min: -25, max: 25 }
  },
  hard: {
    perTurnClamp: { min: -5, max: 5 }
  }
};

function mergeConfig(base: RubricConfig, override?: Partial<RubricConfig>): RubricConfig {
  if (!override) {
    return base;
  }
  return {
    ...base,
    ...override,
    strengthDeltas: {
      ...base.strengthDeltas,
      ...(override.strengthDeltas ?? {})
    },
    comboBonus: {
      ...base.comboBonus,
      ...(override.comboBonus ?? {})
    },
    perTurnClamp: {
      ...base.perTurnClamp,
      ...(override.perTurnClamp ?? {})
    },
    followThrough: {
      ...base.followThrough,
      ...(override.followThrough ?? {})
    }
  };
}

export function resolveProfile(profile?: string): RubricProfile {
  if (profile === "training") {
    return "training";
  }
  if (profile === "easy") {
    return "easy";
  }
  if (profile === "medium") {
    return "medium";
  }
  if (profile === "hard") {
    return "hard";
  }
  return "strict";
}

export function getEffectiveRubric(
  overrides?: Partial<RubricConfig>,
  profileOverride?: RubricProfile
): RubricConfig {
  const envProfile = resolveProfile(
    profileOverride ??
      process.env.SCORING_PROFILE ??
      process.env.NEXT_PUBLIC_SCORING_PROFILE
  );
  const base = { ...baseDefaults, profile: envProfile };
  const withProfile = mergeConfig(base, profileDefaults[envProfile]);
  return mergeConfig(withProfile, overrides);
}
