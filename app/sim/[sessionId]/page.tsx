"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchScenarioById } from "../../../lib/db/scenarios";
import {
  fetchSessionMetrics,
  fetchTurnMetricsByTurnId,
  updateSessionMetricsWithDeltas,
  createTurnMetrics
} from "../../../lib/db/metrics";
import {
  endSession,
  fetchSessionById,
  incrementTurnCount
} from "../../../lib/db/sessions";
import {
  createCoachTurn,
  createTurn,
  fetchTurnsBySessionId
} from "../../../lib/db/turns";
import { buildCoachResponse } from "../../../lib/coach";
import { computeTurnMetrics } from "../../../lib/scoring";
import MetricGauge from "../../../components/MetricGauge";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import type { DeesRuntimePrompt } from "../../../lib/deesRuntime";
import type { Scenario, Session, SessionMetrics, Turn } from "../../../lib/types";
import type { RubricConfig, RubricProfile } from "../../../lib/rubric";

type PageProps = {
  params: { sessionId: string };
};

type CoachMeSuggestion = {
  id: "light" | "medium" | "strong";
  strength: 1 | 2 | 3;
  label: string;
  phrase: string;
};

const FieldTooltip = ({ text }: { text: string }) => (
  <span className="relative inline-flex items-center">
    <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-400">
      ?
    </span>
    <span className="pointer-events-none absolute right-full top-1/2 z-50 w-64 -translate-y-1/2 -translate-x-3 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {text}
    </span>
  </span>
);

type RubricFormState = {
  profile: "default" | RubricProfile;
  strengthLight: number;
  strengthMedium: number;
  strengthStrong: number;
  comboTwo: number;
  comboThree: number;
  clampMin: number;
  clampMax: number;
  followEnabled: boolean;
  followClarity: number;
  followEscalation: number;
};

type AuditEntry = {
  id: string;
  at: string;
  deltas: {
    empathy: number;
    clarity: number;
    boundary: number;
    escalation: number;
  };
  metricsBefore: {
    empathy: number;
    clarity: number;
    boundaries: number;
    escalation: number;
  } | null;
  metricsAfter: {
    empathy: number;
    clarity: number;
    boundaries: number;
    escalation: number;
  } | null;
  gaugesBefore: {
    overall: number;
    empathy: number;
    clarity: number;
    boundaries: number;
    escalation: number;
  } | null;
  gaugesAfter: {
    overall: number;
    empathy: number;
    clarity: number;
    boundaries: number;
    escalation: number;
  } | null;
};

export default function SimulationPage({ params }: PageProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [lastTurnMetrics, setLastTurnMetrics] = useState<{
    empathy_delta: number;
    clarity_delta: number;
    boundary_delta: number;
    escalation_delta: number;
    reasons?: unknown;
  } | null>(null);
  const [lastCoachTurnId, setLastCoachTurnId] = useState<string | null>(null);
  const [debugMetricsOverride, setDebugMetricsOverride] = useState<{
    enabled: boolean;
    overall: number;
    empathy: number;
    clarity: number;
    boundaries: number;
    escalation: number;
  }>({
    enabled: false,
    overall: 50,
    empathy: 50,
    clarity: 50,
    boundaries: 50,
    escalation: 50
  });
  const [metricsTunerCollapsed, setMetricsTunerCollapsed] = useState(false);
  const [aiMeta, setAiMeta] = useState<{
    source: string;
    model: string | null;
    prompt_hash: string | null;
  } | null>(null);
  const [lastRuntimePrompt, setLastRuntimePrompt] =
    useState<DeesRuntimePrompt | null>(null);
  const [deesEscalationOverride, setDeesEscalationOverride] = useState<
    number | ""
  >("");
  const [isCoachMeOpen, setIsCoachMeOpen] = useState(false);
  const [coachMeMetric, setCoachMeMetric] = useState<
    "empathy" | "clarity" | "boundaries" | "de-escalation"
  >("empathy");
  const [coachMeStrength, setCoachMeStrength] = useState<1 | 2 | 3>(1);
  const [coachMeVariability, setCoachMeVariability] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [coachMeSuggestions, setCoachMeSuggestions] = useState<
    CoachMeSuggestion[]
  >([]);
  const [coachMeError, setCoachMeError] = useState<string | null>(null);
  const [coachMeLoading, setCoachMeLoading] = useState(false);
  const [rubricForm, setRubricForm] = useState<RubricFormState>({
    profile: "default",
    strengthLight: 1,
    strengthMedium: 2,
    strengthStrong: 3,
    comboTwo: 1,
    comboThree: 2,
    clampMin: -5,
    clampMax: 5,
    followEnabled: false,
    followClarity: 1,
    followEscalation: 1
  });
  const [rubricEffective, setRubricEffective] = useState<RubricConfig | null>(
    null
  );
  const [rubricPanelCollapsed, setRubricPanelCollapsed] = useState(false);
  const [rubricSaving, setRubricSaving] = useState(false);
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [rubricAppliedAt, setRubricAppliedAt] = useState<string | null>(null);
  const [showDevPanels, setShowDevPanels] = useState(true);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const sessionId = useMemo(() => params.sessionId, [params.sessionId]);
  const userTurnCount = useMemo(
    () => turns.filter((turn) => turn.role === "user").length,
    [turns]
  );

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const showAiDebug =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEBUG_AI === "1";
  const showMetricsTuner =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEBUG_METRICS === "1";
  const showCoachMe = process.env.NEXT_PUBLIC_ENABLE_COACH_ME === "true";
  const showRubricTuner =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_RUBRIC_TUNER === "true";
  const METRIC_POLARITY = {
    empathy: "higher_better",
    clarity: "higher_better",
    boundaries: "higher_better",
    escalation: "higher_better"
  } as const;

  const escalationLevelToGauge = (level: number) => {
    const safeLevel = clamp(level, 0, 5);
    const baseline = 50;
    const step = 20;
    return clamp(baseline + (safeLevel - 2) * step, 0, 100);
  };

  const buildGaugeValues = (sourceMetrics: SessionMetrics | null) => {
    if (!sourceMetrics) {
      return null;
    }
    const rawValues = {
      empathy: sourceMetrics.empathy_score,
      clarity: sourceMetrics.clarity_score,
      boundaries: sourceMetrics.boundary_score,
      escalation: escalationLevelToGauge(sourceMetrics.escalation_level)
    };
    const displayValues = {
      empathy:
        METRIC_POLARITY.empathy === "lower_better"
          ? 100 - rawValues.empathy
          : rawValues.empathy,
      clarity:
        METRIC_POLARITY.clarity === "lower_better"
          ? 100 - rawValues.clarity
          : rawValues.clarity,
      boundaries:
        METRIC_POLARITY.boundaries === "lower_better"
          ? 100 - rawValues.boundaries
          : rawValues.boundaries,
      escalation:
        METRIC_POLARITY.escalation === "lower_better"
          ? 100 - rawValues.escalation
          : rawValues.escalation
    };
    const overall = clamp(
      Math.round(
        0.3 * displayValues.empathy +
          0.25 * displayValues.clarity +
          0.25 * displayValues.boundaries +
          0.2 * displayValues.escalation
      ),
      0,
      100
    );
    return { ...displayValues, overall };
  };

  const gaugeInputs = useMemo(() => {
    if (!metrics) {
      return null;
    }
    const rawValues = {
      empathy: metrics.empathy_score,
      clarity: metrics.clarity_score,
      boundaries: metrics.boundary_score,
      escalation: escalationLevelToGauge(metrics.escalation_level)
    };
    const displayValues = {
      empathy:
        METRIC_POLARITY.empathy === "lower_better"
          ? 100 - rawValues.empathy
          : rawValues.empathy,
      clarity:
        METRIC_POLARITY.clarity === "lower_better"
          ? 100 - rawValues.clarity
          : rawValues.clarity,
      boundaries:
        METRIC_POLARITY.boundaries === "lower_better"
          ? 100 - rawValues.boundaries
          : rawValues.boundaries,
      escalation:
        METRIC_POLARITY.escalation === "lower_better"
          ? 100 - rawValues.escalation
          : rawValues.escalation
    };
    const overall = clamp(
      Math.round(
        0.3 * displayValues.empathy +
          0.25 * displayValues.clarity +
          0.25 * displayValues.boundaries +
          0.2 * displayValues.escalation
      ),
      0,
      100
    );
    const liveValues = { ...displayValues, overall };
    const baseValues = debugMetricsOverride.enabled
      ? debugMetricsOverride
      : liveValues;
    const turnCount = session?.turn_count ?? userTurnCount;
    if (turnCount === 0 && !debugMetricsOverride.enabled) {
      return { ...baseValues, overall: 50, escalation: 50 };
    }
    return baseValues;
  }, [debugMetricsOverride, metrics, session?.turn_count, userTurnCount]);
  const fallbackGaugeValues = gaugeInputs ?? {
    overall: 50,
    empathy: 50,
    clarity: 50,
    boundaries: 50,
    escalation: 50
  };

  const handleOverrideToggle = (enabled: boolean) => {
    if (enabled && !debugMetricsOverride.enabled) {
      setDebugMetricsOverride((prev) => ({
        ...fallbackGaugeValues,
        enabled: true
      }));
      return;
    }
    setDebugMetricsOverride((prev) => ({ ...prev, enabled }));
  };

  const handleOverrideReset = () => {
    setDebugMetricsOverride({ ...fallbackGaugeValues, enabled: false });
  };

  const handleOverrideCenter = () => {
    setDebugMetricsOverride((prev) => ({
      ...prev,
      enabled: true,
      overall: 50,
      empathy: 50,
      clarity: 50,
      boundaries: 50,
      escalation: 50
    }));
  };

  const handleCoachMeRequest = async () => {
    if (!session) {
      return;
    }
    setCoachMeLoading(true);
    setCoachMeError(null);
    try {
      const response = await fetch("/api/sim/coach-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            selectedMetric: coachMeMetric,
            selectedStrength: coachMeStrength,
            selectedVariability: coachMeVariability
          })
        });
      if (!response.ok) {
        throw new Error("Coach Me unavailable.");
      }
      const data = (await response.json()) as {
        metric: string;
        suggestions: CoachMeSuggestion[];
      };
      const suggestions = data.suggestions ?? [];
      setCoachMeSuggestions(suggestions);
    } catch (err: any) {
      setCoachMeError(err?.message ?? "Unable to load suggestions.");
    } finally {
      setCoachMeLoading(false);
    }
  };

  useEffect(() => {
    if (!showRubricTuner) {
      return;
    }
    let isMounted = true;
    const loadRubric = async () => {
      setRubricError(null);
      const stored = typeof window !== "undefined"
        ? window.localStorage.getItem("edcalmsim_rubric_overrides")
        : null;
      if (stored) {
        try {
          const payload = JSON.parse(stored);
          await fetch("/api/dev/rubric", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.warn("[rubric] failed to restore overrides", err);
        }
      }
      const response = await fetch("/api/dev/rubric");
      if (!response.ok) {
        setRubricError("Rubric tuner unavailable.");
        return;
      }
      const data = (await response.json()) as {
        effective: RubricConfig;
        profileOverride: RubricProfile | null;
      };
      if (!isMounted) {
        return;
      }
      setRubricEffective(data.effective);
      setRubricForm({
        profile: data.profileOverride ?? "default",
        strengthLight: data.effective.strengthDeltas.light,
        strengthMedium: data.effective.strengthDeltas.medium,
        strengthStrong: data.effective.strengthDeltas.strong,
        comboTwo: data.effective.comboBonus.two,
        comboThree: data.effective.comboBonus.three,
        clampMin: data.effective.perTurnClamp.min,
        clampMax: data.effective.perTurnClamp.max,
        followEnabled: data.effective.followThrough.enabled,
        followClarity: data.effective.followThrough.clarity,
        followEscalation: data.effective.followThrough.escalation
      });
    };
    loadRubric();
    return () => {
      isMounted = false;
    };
  }, [showRubricTuner]);

  const handleRubricApply = async () => {
    if (!showRubricTuner) {
      return;
    }
    setRubricSaving(true);
    setRubricError(null);
    const payload = {
      ...(rubricForm.profile !== "default"
        ? { profile: rubricForm.profile }
        : {}),
      overrides: {
        strengthDeltas: {
          light: rubricForm.strengthLight,
          medium: rubricForm.strengthMedium,
          strong: rubricForm.strengthStrong
        },
        comboBonus: {
          two: rubricForm.comboTwo,
          three: rubricForm.comboThree,
          applyTo: "escalation"
        },
        perTurnClamp: {
          min: rubricForm.clampMin,
          max: rubricForm.clampMax
        },
        followThrough: {
          enabled: rubricForm.followEnabled,
          clarity: rubricForm.followClarity,
          escalation: rubricForm.followEscalation
        }
      }
    };
    try {
      const response = await fetch("/api/dev/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Unable to apply rubric overrides.");
      }
      const data = (await response.json()) as { effective: RubricConfig };
      setRubricEffective(data.effective);
      setRubricAppliedAt(new Date().toLocaleTimeString());
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "edcalmsim_rubric_overrides",
          JSON.stringify(payload)
        );
      }
    } catch (err: any) {
      setRubricError(err?.message ?? "Unable to apply rubric overrides.");
    } finally {
      setRubricSaving(false);
    }
  };

  const handleRubricReset = async () => {
    if (!showRubricTuner) {
      return;
    }
    setRubricSaving(true);
    setRubricError(null);
    try {
      const response = await fetch("/api/dev/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true })
      });
      if (!response.ok) {
        throw new Error("Unable to reset rubric overrides.");
      }
      const data = (await response.json()) as { effective: RubricConfig };
      setRubricEffective(data.effective);
      setRubricForm({
        profile: "default",
        strengthLight: data.effective.strengthDeltas.light,
        strengthMedium: data.effective.strengthDeltas.medium,
        strengthStrong: data.effective.strengthDeltas.strong,
        comboTwo: data.effective.comboBonus.two,
        comboThree: data.effective.comboBonus.three,
        clampMin: data.effective.perTurnClamp.min,
        clampMax: data.effective.perTurnClamp.max,
        followEnabled: data.effective.followThrough.enabled,
        followClarity: data.effective.followThrough.clarity,
        followEscalation: data.effective.followThrough.escalation
      });
      setRubricAppliedAt(new Date().toLocaleTimeString());
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("edcalmsim_rubric_overrides");
      }
    } catch (err: any) {
      setRubricError(err?.message ?? "Unable to reset rubric overrides.");
    } finally {
      setRubricSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setIsLoading(true);
      const { data: sessionData, error: sessionError } =
        await fetchSessionById(sessionId);

      if (!isMounted) {
        return;
      }

      if (sessionError || !sessionData) {
        setError(sessionError ?? "Session not found.");
        setSession(null);
        setScenario(null);
        setTurns([]);
        setIsLoading(false);
        return;
      }

      const [
        { data: scenarioData, error: scenarioError },
        turnsResult,
        metricsResult
      ] = await Promise.all([
        fetchScenarioById(sessionData.scenario_id),
        fetchTurnsBySessionId(sessionId),
        fetchSessionMetrics(sessionId)
      ]);

      if (!isMounted) {
        return;
      }

      let errorMessage: string | null = null;

      if (scenarioError || !scenarioData) {
        errorMessage = scenarioError ?? "Scenario not found.";
        setScenario(null);
      } else {
        setScenario(scenarioData);
      }

      if (turnsResult.error) {
        errorMessage = errorMessage ?? turnsResult.error;
        setTurns([]);
      } else {
        setTurns(turnsResult.data ?? []);
      }

      if (metricsResult.error) {
        errorMessage = errorMessage ?? metricsResult.error;
        setMetrics(null);
      } else {
        const baseMetrics = metricsResult.data;
        if (baseMetrics) {
          setMetrics({
            ...baseMetrics,
            empathy_score: 50,
            clarity_score: 50,
            boundary_score: 50,
            escalation_level: 2
          });
        } else {
          setMetrics(baseMetrics);
        }
      }

      setSession(sessionData);
      setError(errorMessage);
      setIsLoading(false);
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!showAiDebug || !metrics) {
      return;
    }
    const turnValue = session?.turn_count ?? userTurnCount;
    console.log(
      `[metrics] E=${metrics.empathy_score} C=${metrics.clarity_score} B=${metrics.boundary_score} Esc=${metrics.escalation_level} (turn=${turnValue})`
    );
  }, [metrics, session?.turn_count, showAiDebug, userTurnCount]);

  useEffect(() => {
    if (!showAiDebug || !metrics || !gaugeInputs) {
      return;
    }
    console.log(
      "[metrics] raw:",
      {
        empathy: metrics.empathy_score,
        clarity: metrics.clarity_score,
        boundaries: metrics.boundary_score,
        escalation: escalationLevelToGauge(metrics.escalation_level)
      },
      "display:",
      {
        overall: gaugeInputs.overall,
        empathy: gaugeInputs.empathy,
        clarity: gaugeInputs.clarity,
        boundaries: gaugeInputs.boundaries,
        escalation: gaugeInputs.escalation
      },
      "polarity:",
      METRIC_POLARITY
    );
  }, [gaugeInputs, metrics, showAiDebug]);

  const handleSend = async () => {
    if (!session || !input.trim()) {
      return;
    }

    setIsSending(true);
    setError(null);
    const trimmedInput = input.trim();
    const metricsBefore = metrics
      ? {
          empathy: metrics.empathy_score,
          clarity: metrics.clarity_score,
          boundaries: metrics.boundary_score,
          escalation: metrics.escalation_level
        }
      : null;
    const gaugesBefore = buildGaugeValues(metrics);
    const { deltas, reasons } = computeTurnMetrics(trimmedInput, {
      rubric: rubricEffective ?? undefined
    });
    const nextUserTurnCount = session.turn_count + 1;

    const { data, error: turnError } = await createTurn(
      session.id,
      "user",
      trimmedInput,
      { source: "user" }
    );

    if (turnError || !data) {
      setError(turnError ?? "Unable to send message.");
      setIsSending(false);
      return;
    }

    const { data: createdTurnMetrics, error: turnMetricsError } =
      await createTurnMetrics(session.id, data.id, deltas, reasons);
    if (turnMetricsError) {
      setError(turnMetricsError);
    }

    const { data: metricsData, error: metricsError } =
      await updateSessionMetricsWithDeltas(session.id, deltas);
    if (metricsError) {
      setError(metricsError);
    }

    const { error: incrementError } = await incrementTurnCount(session.id);
    if (incrementError) {
      setError(incrementError);
    }

    const { data: latestMetrics, error: metricsFetchError } =
      await fetchSessionMetrics(session.id);
    if (metricsFetchError) {
      setError(metricsFetchError);
    }

    const { data: latestTurnMetrics, error: turnMetricsFetchError } =
      createdTurnMetrics
        ? { data: createdTurnMetrics, error: null }
        : await fetchTurnMetricsByTurnId(data.id);
    if (turnMetricsFetchError) {
      setError(turnMetricsFetchError);
    }

    const finalMetrics = metricsData ?? latestMetrics ?? metrics;
    const finalTurnMetrics = latestTurnMetrics;

    const buildDeltaBadges = (turnMetrics: typeof finalTurnMetrics) => {
      if (!turnMetrics) {
        return "ΔE:+0 ΔC:+0 ΔB:+0 ΔEsc:+0";
      }
      const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
      return [
        `ΔE:${formatDelta(turnMetrics.empathy_delta)}`,
        `ΔC:${formatDelta(turnMetrics.clarity_delta)}`,
        `ΔB:${formatDelta(turnMetrics.boundary_delta)}`,
        `ΔEsc:${formatDelta(turnMetrics.escalation_delta)}`
      ].join(" ");
    };

    const formatCoachContent = (coach: {
      category: string;
      tip: string;
      rewrite: string;
      next_step: string;
      why: string;
      deltas?: string;
    }) => {
      const safeCategory = coach.category?.trim() || "Neutral";
      const safeWhy = coach.why?.trim() || "delta based on scoring rules";
      const safeTip = coach.tip?.trim() || "Add validation and one clear next step.";
      const safeRewrite =
        coach.rewrite?.trim() ||
        "I hear you. Here's what I can do next: [action]. I'll update you in [time].";
      const safeNextStep =
        coach.next_step?.trim() || "Next step: ask one clarifying question.";
      const deltaBadges = buildDeltaBadges(finalTurnMetrics);
      return [
        `Category: ${safeCategory} (${deltaBadges})`,
        `Tip: ${safeTip}`,
        `Why: ${safeWhy}`,
        `Rewrite: ${safeRewrite}`,
        `Next step: ${safeNextStep}`
      ].join("\n");
    };

    let patientTurn: Turn | null = null;
    let coachTurn: Turn | null = null;
    let needsFallbackPatient = false;
    let needsFallbackCoach = false;

    if (finalMetrics && finalTurnMetrics && !metricsError) {
      try {
        const response = await fetch("/api/sim/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            metrics: finalMetrics,
            lastTurnMetrics: finalTurnMetrics,
            debugRuntimePrompt: showAiDebug,
            debugEscalationOverride:
              deesEscalationOverride === ""
                ? null
                : Number(deesEscalationOverride)
          })
        });

        if (!response.ok) {
          throw new Error("AI response not available.");
        }

        const aiPayload = (await response.json()) as {
          patient?: string;
          coach?: {
            category: string;
            tip: string;
            rewrite: string;
            next_step: string;
            why: string;
            deltas?: string;
          };
          runtime_prompt?: DeesRuntimePrompt | null;
          meta?: {
            source: "ai" | "repaired" | "heuristic";
            model: string;
            prompt_hash: string;
          };
          metrics?: SessionMetrics;
          lastTurnMetrics?: {
            empathy_delta: number;
            clarity_delta: number;
            boundary_delta: number;
            escalation_delta: number;
            reasons?: unknown;
          };
        };

        if (!aiPayload.patient || !aiPayload.coach) {
          throw new Error("AI response missing patient or coach.");
        }
        const meta = aiPayload.meta ?? null;
        if (meta) {
          setAiMeta({
            source: meta.source,
            model: meta.model,
            prompt_hash: meta.prompt_hash
          });
        }
        setLastRuntimePrompt(aiPayload.runtime_prompt ?? null);
        const responseMetrics =
          aiPayload.metrics ?? latestMetrics ?? metricsData ?? null;
        const responseTurnMetrics =
          aiPayload.lastTurnMetrics ?? latestTurnMetrics ?? null;
        if (showAiDebug) {
          console.log("[sim-next coach payload]", aiPayload.coach);
        }

        const isAiSource = meta?.source === "ai" || meta?.source === "repaired";
        const { data: patientData, error: patientError } = await createTurn(
          session.id,
          "patient",
          aiPayload.patient,
          {
            source: meta?.source ?? "heuristic",
            model: isAiSource ? meta?.model ?? null : null,
            prompt_hash: isAiSource ? meta?.prompt_hash ?? null : null
          }
        );
        if (patientError) {
          console.error("Patient turn insert failed.", patientError);
          needsFallbackPatient = true;
        } else {
          patientTurn = patientData;
        }

        const coachContent = formatCoachContent(aiPayload.coach);
        if (showAiDebug) {
          console.log("[sim-next coach insert]", {
            content: coachContent,
            category: aiPayload.coach.category,
            tip: aiPayload.coach.tip,
            why: aiPayload.coach.why,
            rewrite: aiPayload.coach.rewrite,
            next_step: aiPayload.coach.next_step
          });
        }
        const { data: coachData, error: coachError } = await createCoachTurn(
          session.id,
          coachContent,
          aiPayload.coach.category,
          aiPayload.coach.tip,
          aiPayload.coach.rewrite,
          {
            source: meta?.source ?? "heuristic",
            model: isAiSource ? meta?.model ?? null : null,
            prompt_hash: isAiSource ? meta?.prompt_hash ?? null : null
          }
        );
        if (coachError) {
          console.error("Coach turn insert failed.", coachError);
          needsFallbackCoach = true;
        } else {
          coachTurn = coachData;
          setLastCoachTurnId(coachData.id);
          if (showAiDebug) {
            const client = getSupabaseClient();
            if (client) {
              const { data: persisted, error: persistedError } = await client
                .from("turns")
                .select("id, content, coach_tip, coach_rewrite")
                .eq("id", coachData.id)
                .single();
              if (persistedError) {
                console.log("[sim-next coach persisted error]", persistedError);
              } else {
                console.log("[sim-next coach persisted]", persisted);
              }
            }
          }
        }

        const nextTurns = [
          ...turns,
          data,
          ...(patientTurn ? [patientTurn] : []),
          ...(coachTurn ? [coachTurn] : [])
        ];
        setTurns(nextTurns);
        if (responseMetrics) {
          setMetrics(responseMetrics);
        }
        setLastTurnMetrics(responseTurnMetrics);
        if (showAiDebug) {
          setAuditLog((prev) => [
            {
              id: `${data.id}-ai`,
              at: new Date().toISOString(),
              deltas: {
                empathy: responseTurnMetrics?.empathy_delta ?? 0,
                clarity: responseTurnMetrics?.clarity_delta ?? 0,
                boundary: responseTurnMetrics?.boundary_delta ?? 0,
                escalation: responseTurnMetrics?.escalation_delta ?? 0
              },
              metricsBefore,
              metricsAfter: responseMetrics
                ? {
                    empathy: responseMetrics.empathy_score,
                    clarity: responseMetrics.clarity_score,
                    boundaries: responseMetrics.boundary_score,
                    escalation: responseMetrics.escalation_level
                  }
                : null,
              gaugesBefore,
              gaugesAfter: buildGaugeValues(responseMetrics ?? null)
            },
            ...prev
          ].slice(0, 50));
        }
        setSession((prev) =>
          prev ? { ...prev, turn_count: prev.turn_count + 1 } : prev
        );
        setInput("");
        setIsSending(false);
        return;
      } catch (aiError) {
        console.error("AI response failed.", aiError);
        needsFallbackPatient = true;
        needsFallbackCoach = true;
      }
    } else {
      needsFallbackPatient = true;
      needsFallbackCoach = true;
    }

    if (needsFallbackCoach && finalTurnMetrics) {
      const fallbackCoach = buildCoachResponse(
        finalTurnMetrics,
        nextUserTurnCount
      );
      const { data: coachData, error: coachError } = await createCoachTurn(
        session.id,
        fallbackCoach.content,
        fallbackCoach.category,
        fallbackCoach.tip,
        fallbackCoach.rewrite,
        { source: "heuristic", model: null, prompt_hash: null }
      );
      if (coachError) {
        console.error("Coach turn insert failed.", coachError);
      } else {
        coachTurn = coachData;
        setLastCoachTurnId(coachData.id);
      }
    }

    if (needsFallbackPatient) {
      const { data: patientData, error: patientError } = await createTurn(
        session.id,
        "patient",
        "(Patient response unavailable - AI offline.)",
        { source: "heuristic" }
      );
      if (patientError) {
        console.error("Patient turn insert failed.", patientError);
      } else {
        patientTurn = patientData;
      }
    }

    setSession((prev) =>
      prev ? { ...prev, turn_count: prev.turn_count + 1 } : prev
    );
    const fallbackTurns = [
      ...turns,
      data,
      ...(patientTurn ? [patientTurn] : []),
      ...(coachTurn ? [coachTurn] : [])
    ];
    setTurns(fallbackTurns);
    const fallbackMetrics = latestMetrics ?? metricsData ?? null;
    if (fallbackMetrics) {
      setMetrics(fallbackMetrics);
    }
    setLastTurnMetrics(latestTurnMetrics ?? null);
    if (showAiDebug) {
      setAuditLog((prev) => [
        {
          id: `${data.id}-fallback`,
          at: new Date().toISOString(),
          deltas: {
            empathy: latestTurnMetrics?.empathy_delta ?? 0,
            clarity: latestTurnMetrics?.clarity_delta ?? 0,
            boundary: latestTurnMetrics?.boundary_delta ?? 0,
            escalation: latestTurnMetrics?.escalation_delta ?? 0
          },
          metricsBefore,
          metricsAfter: fallbackMetrics
            ? {
                empathy: fallbackMetrics.empathy_score,
                clarity: fallbackMetrics.clarity_score,
                boundaries: fallbackMetrics.boundary_score,
                escalation: fallbackMetrics.escalation_level
              }
            : null,
          gaugesBefore,
          gaugesAfter: buildGaugeValues(fallbackMetrics ?? null)
        },
        ...prev
      ].slice(0, 50));
    }
    setInput("");
    setIsSending(false);
  };

  const handleEndSession = async () => {
    if (!session) {
      return;
    }

    setIsEnding(true);
    setError(null);

    const { error: endError } = await endSession(
      session.id,
      "Session ended by participant."
    );

    if (endError) {
      setError(endError);
      setIsEnding(false);
      return;
    }

    router.push(`/results/${session.id}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Loading session...</h1>
        <p className="mt-2 text-sm text-slate-300">
          Fetching session details and transcript.
        </p>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Simulation Not Found</h1>
        <p className="mt-2 text-sm text-slate-300">
          This session id does not exist or is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Session {session.id}
        </div>
        <h1 className="mt-2 text-2xl font-semibold">{scenario.title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {scenario.description ?? "No description provided yet."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Outcome: {session.outcome}
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Turns: {userTurnCount}
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Started: {session.started_at}
          </span>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </section>
      )}

      <section className="sticky top-4 z-20 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold">Metrics</h2>
        {showMetricsTuner && (
          <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Debug metrics: {debugMetricsOverride.enabled ? "OVERRIDE" : "LIVE"}
          </div>
        )}
        {metrics ? (
          <div className="mt-5 grid grid-cols-1 place-items-center gap-6 md:grid-cols-2 lg:grid-cols-5">
            <MetricGauge
              label="Overall"
              value={gaugeInputs?.overall ?? 0}
              size={176}
            />
            <MetricGauge label="Empathy" value={gaugeInputs?.empathy ?? 0} />
            <MetricGauge label="Clarity" value={gaugeInputs?.clarity ?? 0} />
            <MetricGauge label="Boundaries" value={gaugeInputs?.boundaries ?? 0} />
            <MetricGauge
              label="Escalation"
              value={gaugeInputs?.escalation ?? 0}
              detail={
                debugMetricsOverride.enabled
                  ? "Override"
                  : `Level ${metrics.escalation_level}/5`
              }
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Metrics are not available yet.
          </p>
        )}
        {showAiDebug && aiMeta && (
          <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-500">
            AI: {aiMeta.source} | model: {aiMeta.model ?? "n/a"} | prompt:{" "}
            {aiMeta.prompt_hash ? aiMeta.prompt_hash.slice(0, 8) : "n/a"}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Simulation Chat</h2>
        <div className="mt-4 space-y-4">
          {turns.map((turn) => {
            const baseClasses = "rounded-xl p-4";
            const roleClasses =
              turn.role === "coach"
                ? "border border-emerald-500/40 bg-emerald-500/10"
                : turn.role === "patient"
                ? "border border-amber-500/40 bg-amber-500/10"
                : turn.role === "system"
                ? "border border-slate-700 bg-slate-950/60"
                : "bg-slate-950/60";
            const roleLabel = turn.role.toUpperCase();

            const rawCategory =
              turn.coach_category ??
              (turn.content.split("\n")[0]?.replace("Category:", "").trim() ??
                "Neutral");
            const categoryLabel = rawCategory.split("(")[0]?.trim() || "Neutral";
            const shouldUseDeterministicDeltas =
              turn.role === "coach" && turn.id === lastCoachTurnId;
            const deterministicDeltas = lastTurnMetrics;
            const deltaValues = shouldUseDeterministicDeltas && deterministicDeltas
              ? {
                  empathy: deterministicDeltas.empathy_delta,
                  clarity: deterministicDeltas.clarity_delta,
                  boundary: deterministicDeltas.boundary_delta,
                  escalation: deterministicDeltas.escalation_delta
                }
              : null;
            const parsedDeltas = (() => {
              const match = turn.content.match(/\\(ΔE:([^\\s]+)\\s+ΔC:([^\\s]+)\\s+ΔB:([^\\s]+)\\s+ΔEsc:([^\\s]+)\\)/);
              if (!match) {
                return null;
              }
              return {
                empathy: Number(match[2]),
                clarity: Number(match[3]),
                boundary: Number(match[4]),
                escalation: Number(match[5])
              };
            })();
            const deltas = deltaValues ?? parsedDeltas;
            const badgeClass = (delta?: number) => {
              if (typeof delta !== "number" || Number.isNaN(delta)) {
                return "border-slate-700 bg-slate-900/70 text-slate-300";
              }
              if (delta > 0) {
                return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
              }
              if (delta < 0) {
                return "border-rose-500/40 bg-rose-500/10 text-rose-200";
              }
              return "border-slate-700 bg-slate-900/70 text-slate-300";
            };
            const contentLines = turn.content.split("\\n");
            const getCoachLine = (prefix: string) =>
              contentLines
                .find((line) => line.startsWith(`${prefix}:`))
                ?.slice(prefix.length + 1)
                .trim();
            const coachFields = {
              tip: turn.coach_tip ?? getCoachLine("Tip"),
              why: getCoachLine("Why"),
              rewrite: turn.coach_rewrite ?? getCoachLine("Rewrite"),
              nextStep: getCoachLine("Next step")
            };
            const detailKeys = [
              coachFields.tip ? "tip" : null,
              coachFields.why ? "why" : null,
              coachFields.rewrite ? "rewrite" : null,
              coachFields.nextStep ? "next" : null
            ].filter(Boolean);
            const fallbackBody = contentLines
              .filter((line) => !line.startsWith("Category:"))
              .join("\\n")
              .trim();

            return (
              <div key={turn.id} className={`${baseClasses} ${roleClasses}`}>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {roleLabel} · {turn.created_at}
                </div>
                {turn.role === "coach" ? (
                  <div className="mt-2 space-y-3 text-sm text-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                        {categoryLabel}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${badgeClass(
                          deltas?.empathy
                        )}`}
                      >
                        Empathy: {deltas?.empathy ?? 0}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${badgeClass(
                          deltas?.clarity
                        )}`}
                      >
                        Clarity: {deltas?.clarity ?? 0}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${badgeClass(
                          deltas?.boundary
                        )}`}
                      >
                        Boundaries: {deltas?.boundary ?? 0}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${badgeClass(
                          deltas?.escalation
                        )}`}
                      >
                        Escalation: {deltas?.escalation ?? 0}
                      </span>
                    </div>
                    {showAiDebug && (
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        Esc shown as Escalation (raw)
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-slate-100">
                      {showAiDebug && (
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">
                          DETAILS:{" "}
                          {detailKeys.length > 0
                            ? detailKeys.join("/")
                            : "missing"}
                        </div>
                      )}
                      {coachFields.tip && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            Tip
                          </span>
                          <div>{coachFields.tip}</div>
                        </div>
                      )}
                      {coachFields.why && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            Why
                          </span>
                          <div>{coachFields.why}</div>
                        </div>
                      )}
                      {coachFields.rewrite && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            Rewrite
                          </span>
                          <div>{coachFields.rewrite}</div>
                        </div>
                      )}
                      {coachFields.nextStep && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            Next step
                          </span>
                          <div>{coachFields.nextStep}</div>
                        </div>
                      )}
                      {!coachFields.tip &&
                        !coachFields.why &&
                        !coachFields.rewrite &&
                        !coachFields.nextStep &&
                        (fallbackBody ? (
                          <div>
                            <span className="text-xs uppercase tracking-wide text-slate-400">
                              Coach
                            </span>
                            <div className="whitespace-pre-line">
                              {fallbackBody}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400">
                            Coach feedback unavailable for this turn (using safe
                            defaults).
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-100">
                    {turn.content}
                  </p>
                )}
              </div>
            );
          })}
          {turns.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              No turns yet. Start the conversation when ready.
            </div>
          )}
        </div>
        <div className="mt-6 space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100"
            placeholder="Type the next facilitator prompt..."
          />
          {showCoachMe && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Coach Me
                </div>
                <button
                  type="button"
                  onClick={() => setIsCoachMeOpen((prev) => !prev)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  {isCoachMeOpen ? "Hide" : "Show"}
                </button>
              </div>
              {isCoachMeOpen && (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-300">
                      Metric
                      <select
                        value={coachMeMetric}
                        onChange={(event) =>
                          setCoachMeMetric(
                            event.target.value as typeof coachMeMetric
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      >
                        <option value="empathy">Empathy</option>
                        <option value="clarity">Clarity</option>
                        <option value="boundaries">Boundaries</option>
                        <option value="de-escalation">De-escalation</option>
                      </select>
                    </label>
                    <label className="text-xs text-slate-300">
                      Strength
                      <select
                        value={coachMeStrength}
                        onChange={(event) =>
                          setCoachMeStrength(Number(event.target.value) as 1 | 2 | 3)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      >
                        <option value={1}>Light (+1)</option>
                        <option value={2}>Medium (+2)</option>
                        <option value={3}>Strong (+3)</option>
                      </select>
                    </label>
                    <label className="text-xs text-slate-300">
                      Variability
                      <select
                        value={coachMeVariability}
                        onChange={(event) =>
                          setCoachMeVariability(
                            event.target.value as typeof coachMeVariability
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCoachMeRequest}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={coachMeLoading}
                    >
                      {coachMeLoading ? "Loading..." : "Get Coaching Suggestions"}
                    </button>
                    {coachMeError && (
                      <span className="text-xs text-rose-300">
                        {coachMeError}
                      </span>
                    )}
                  </div>
                  {coachMeSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {coachMeSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() =>
                            setInput((prev) =>
                              prev ? `${prev} ${suggestion.phrase}` : suggestion.phrase
                            )
                          }
                          className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-xs text-slate-100 hover:border-slate-500"
                        >
                          <div>{suggestion.phrase}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                            {suggestion.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSend}
              className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSending || !input.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={handleEndSession}
              className="rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isEnding}
            >
              {isEnding ? "Ending..." : "End Session"}
            </button>
          </div>
        </div>
      </section>
      {(showMetricsTuner || showRubricTuner) && showDevPanels && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 p-6 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Dev Panels
            </div>
            <button
              type="button"
              onClick={() => setShowDevPanels(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-1 gap-4 overflow-y-auto">
            {showMetricsTuner && (
              <div className="w-1/3 min-w-[320px] rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                    Metrics Tuner
                  </div>
                </div>
                <div className="mt-3 space-y-3 text-xs text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={debugMetricsOverride.enabled}
                      onChange={(event) =>
                        handleOverrideToggle(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400"
                    />
                    Override gauges
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Overall</span>
                      <span>{debugMetricsOverride.overall}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={debugMetricsOverride.overall}
                      onChange={(event) =>
                        setDebugMetricsOverride((prev) => ({
                          ...prev,
                          overall: Number(event.target.value),
                          enabled: true
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Empathy</span>
                      <span>{debugMetricsOverride.empathy}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={debugMetricsOverride.empathy}
                      onChange={(event) =>
                        setDebugMetricsOverride((prev) => ({
                          ...prev,
                          empathy: Number(event.target.value),
                          enabled: true
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Clarity</span>
                      <span>{debugMetricsOverride.clarity}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={debugMetricsOverride.clarity}
                      onChange={(event) =>
                        setDebugMetricsOverride((prev) => ({
                          ...prev,
                          clarity: Number(event.target.value),
                          enabled: true
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Boundaries</span>
                      <span>{debugMetricsOverride.boundaries}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={debugMetricsOverride.boundaries}
                      onChange={(event) =>
                        setDebugMetricsOverride((prev) => ({
                          ...prev,
                          boundaries: Number(event.target.value),
                          enabled: true
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Escalation gauge</span>
                      <span>{debugMetricsOverride.escalation}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={debugMetricsOverride.escalation}
                      onChange={(event) =>
                        setDebugMetricsOverride((prev) => ({
                          ...prev,
                          escalation: Number(event.target.value),
                          enabled: true
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOverrideReset}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
                    >
                      Reset to live
                    </button>
                    <button
                      type="button"
                      onClick={handleOverrideCenter}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
                    >
                      Center all (50)
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showRubricTuner && (
              <div className="w-1/3 min-w-[320px] rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                    Rubric Tuner
                  </div>
                </div>
                <div className="mt-3 space-y-3 text-xs text-slate-300">
                  <label className="text-xs text-slate-300">
                    <span className="group inline-flex items-center gap-1">
                      Profile override
                      <FieldTooltip text="Preset difficulty that controls per-turn scaling and clamps." />
                    </span>
                    <select
                      value={rubricForm.profile}
                      onChange={(event) =>
                        setRubricForm((prev) => ({
                          ...prev,
                          profile: event.target.value as RubricFormState["profile"]
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                    >
                      <option value="default">Default (env)</option>
                      <option value="easy">Easy (10 pts)</option>
                      <option value="medium">Medium (5 pts)</option>
                      <option value="hard">Hard (1 pt)</option>
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Light
                        <FieldTooltip text="Coach Me Light hint strength value before scaling." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.strengthLight}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            strengthLight: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Medium
                        <FieldTooltip text="Coach Me Medium hint strength value before scaling." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.strengthMedium}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            strengthMedium: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Strong
                        <FieldTooltip text="Coach Me Strong hint strength value before scaling." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.strengthStrong}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            strengthStrong: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Combo >=2
                        <FieldTooltip text="Bonus applied when at least 2 metrics are positive in the same user turn." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.comboTwo}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            comboTwo: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Combo >=3
                        <FieldTooltip text="Bonus applied when at least 3 metrics are positive in the same user turn." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.comboThree}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            comboThree: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Clamp min
                        <FieldTooltip text="Lower bound for per-turn delta after scaling." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.clampMin}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            clampMin: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Clamp max
                        <FieldTooltip text="Upper bound for per-turn delta after scaling." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.clampMax}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            clampMax: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rubricForm.followEnabled}
                      onChange={(event) =>
                        setRubricForm((prev) => ({
                          ...prev,
                          followEnabled: event.target.checked
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400"
                    />
                    <span className="group inline-flex items-center gap-1">
                      Follow-through credit
                      <FieldTooltip text="Enable follow-through detection (promise then follow-up)." />
                    </span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Follow clarity
                        <FieldTooltip text="Clarity bonus applied when follow-through is detected." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.followClarity}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            followClarity: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="group inline-flex items-center gap-1">
                        Follow escalation
                        <FieldTooltip text="Escalation delta applied when follow-through is detected." />
                      </span>
                      <input
                        type="number"
                        value={rubricForm.followEscalation}
                        onChange={(event) =>
                          setRubricForm((prev) => ({
                            ...prev,
                            followEscalation: Number(event.target.value)
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRubricApply}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={rubricSaving}
                    >
                      {rubricSaving ? "Saving..." : "Apply"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRubricReset}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
                      disabled={rubricSaving}
                    >
                      Reset
                    </button>
                    {rubricAppliedAt && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        Applied {rubricAppliedAt}
                      </span>
                    )}
                  </div>
                  {rubricError && (
                    <div className="text-xs text-rose-300">{rubricError}</div>
                  )}
                  {rubricEffective && (
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                      Effective: {rubricEffective.profile} clamp [
                      {rubricEffective.perTurnClamp.min},{" "}
                      {rubricEffective.perTurnClamp.max}]
                    </div>
                  )}
                </div>
              </div>
            )}
            {showAiDebug && (
              <div className="w-1/3 min-w-[320px] rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                    Audit Log
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuditLog([])}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 max-h-48 space-y-3 overflow-y-auto text-[10px] text-slate-300">
                  {auditLog.length === 0 && (
                    <div className="text-slate-500">No entries yet.</div>
                  )}
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-slate-800 bg-slate-950/70 p-2"
                    >
                      <div className="text-[9px] uppercase tracking-wide text-slate-500">
                        {entry.at}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {[
                          { label: "ΔE", value: entry.deltas.empathy },
                          { label: "ΔC", value: entry.deltas.clarity },
                          { label: "ΔB", value: entry.deltas.boundary },
                          { label: "ΔEsc", value: entry.deltas.escalation }
                        ].map((delta) => (
                          <div
                            key={delta.label}
                            className={`rounded-full border px-2 py-1 text-center text-[10px] ${
                              delta.value > 0
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                : delta.value < 0
                                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                                : "border-slate-700 bg-slate-900/70 text-slate-300"
                            }`}
                          >
                            {delta.label}:{delta.value}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-slate-400">
                        <div className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">
                            Metrics (E/C/B/E)
                          </div>
                          <div>
                            {entry.metricsBefore
                              ? `E${entry.metricsBefore.empathy} / C${entry.metricsBefore.clarity} / B${entry.metricsBefore.boundaries} / E${entry.metricsBefore.escalation}`
                              : "n/a"}{" "}
                            →{" "}
                            {entry.metricsAfter
                              ? `E${entry.metricsAfter.empathy} / C${entry.metricsAfter.clarity} / B${entry.metricsAfter.boundaries} / E${entry.metricsAfter.escalation}`
                              : "n/a"}
                          </div>
                        </div>
                        <div className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">
                            Gauges (O/E/C/B/E)
                          </div>
                          <div>
                            {entry.gaugesBefore
                              ? `O${entry.gaugesBefore.overall} / E${entry.gaugesBefore.empathy} / C${entry.gaugesBefore.clarity} / B${entry.gaugesBefore.boundaries} / E${entry.gaugesBefore.escalation}`
                              : "n/a"}{" "}
                            →{" "}
                            {entry.gaugesAfter
                              ? `O${entry.gaugesAfter.overall} / E${entry.gaugesAfter.empathy} / C${entry.gaugesAfter.clarity} / B${entry.gaugesAfter.boundaries} / E${entry.gaugesAfter.escalation}`
                              : "n/a"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showAiDebug && (
              <div className="w-1/3 min-w-[320px] rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                    DEES Runtime
                  </div>
                </div>
                <div className="mt-3 space-y-3 text-xs text-slate-300">
                  <label className="text-xs text-slate-300">
                    Escalation override (1-5)
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={deesEscalationOverride}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setDeesEscalationOverride(
                          nextValue === "" ? "" : Number(nextValue)
                        );
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-100"
                    />
                  </label>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Last runtime JSON (updates each turn)
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-[10px] text-slate-200">
                    {lastRuntimePrompt ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(lastRuntimePrompt, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-slate-500">No runtime JSON yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {(showMetricsTuner || showRubricTuner) && (
        <button
          type="button"
          onClick={() => setShowDevPanels((prev) => !prev)}
          className="fixed bottom-4 right-4 z-50 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 shadow-lg backdrop-blur"
        >
          {showDevPanels ? "Hide Dev Panels" : "Show Dev Panels"}
        </button>
      )}
    </div>
  );
}
