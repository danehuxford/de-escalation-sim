import { NextRequest, NextResponse } from "next/server";
import {
  getEffectiveRubric,
  resolveProfile,
  type RubricConfig,
  type RubricProfile
} from "../../../../lib/rubric";

let rubricOverrides: Partial<RubricConfig> = {};
let profileOverride: RubricProfile | undefined;

const isEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_RUBRIC_TUNER === "true";

const mergeOverrides = (
  current: Partial<RubricConfig>,
  next: Partial<RubricConfig>
): Partial<RubricConfig> => ({
  ...current,
  ...next,
  strengthDeltas: {
    ...current.strengthDeltas,
    ...next.strengthDeltas
  },
  comboBonus: {
    ...current.comboBonus,
    ...next.comboBonus
  },
  perTurnClamp: {
    ...current.perTurnClamp,
    ...next.perTurnClamp
  },
  followThrough: {
    ...current.followThrough,
    ...next.followThrough
  }
});

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeOverrides = (body: any) => {
  const overrides: Partial<RubricConfig> = {};
  if (body?.strengthDeltas) {
    const light = asNumber(body.strengthDeltas.light);
    const medium = asNumber(body.strengthDeltas.medium);
    const strong = asNumber(body.strengthDeltas.strong);
    overrides.strengthDeltas = {
      ...(light !== null ? { light } : {}),
      ...(medium !== null ? { medium } : {}),
      ...(strong !== null ? { strong } : {})
    };
  }
  if (body?.comboBonus) {
    const two = asNumber(body.comboBonus.two);
    const three = asNumber(body.comboBonus.three);
    overrides.comboBonus = {
      ...(two !== null ? { two } : {}),
      ...(three !== null ? { three } : {}),
      ...(body.comboBonus.applyTo ? { applyTo: "escalation" } : {})
    };
  }
  if (body?.perTurnClamp) {
    const min = asNumber(body.perTurnClamp.min);
    const max = asNumber(body.perTurnClamp.max);
    overrides.perTurnClamp = {
      ...(min !== null ? { min } : {}),
      ...(max !== null ? { max } : {})
    };
  }
  if (body?.followThrough) {
    const clarity = asNumber(body.followThrough.clarity);
    const escalation = asNumber(body.followThrough.escalation);
    overrides.followThrough = {
      ...(typeof body.followThrough.enabled === "boolean"
        ? { enabled: body.followThrough.enabled }
        : {}),
      ...(clarity !== null ? { clarity } : {}),
      ...(escalation !== null ? { escalation } : {})
    };
  }
  return overrides;
};

export async function GET() {
  if (!isEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const effective = getEffectiveRubric(rubricOverrides, profileOverride);
  return NextResponse.json({
    effective,
    overrides: rubricOverrides,
    profileOverride: profileOverride ?? null
  });
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  if (body?.reset) {
    rubricOverrides = {};
    profileOverride = undefined;
  } else {
    const incoming = normalizeOverrides(body?.overrides ?? body);
    rubricOverrides = mergeOverrides(rubricOverrides, incoming);
    if (typeof body?.profile === "string") {
      profileOverride = resolveProfile(body.profile);
    }
  }
  const effective = getEffectiveRubric(rubricOverrides, profileOverride);
  return NextResponse.json({
    effective,
    overrides: rubricOverrides,
    profileOverride: profileOverride ?? null
  });
}
