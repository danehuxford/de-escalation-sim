"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchDepartmentById } from "../../../lib/db/departments";
import { fetchScenarioById } from "../../../lib/db/scenarios";
import { fetchSessionById } from "../../../lib/db/sessions";
import { fetchTurnsBySessionId } from "../../../lib/db/turns";
import {
  fetchSessionMetrics,
  fetchTurnMetricsBySessionId
} from "../../../lib/db/metrics";
import { scoringConfig } from "../../../lib/scoringConfig";
import type {
  Scenario,
  Session,
  SessionMetrics,
  Department,
  Turn,
  TurnMetrics
} from "../../../lib/types";

type PageProps = {
  params: { sessionId: string };
};

export default function ResultsPage({ params }: PageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [turnMetrics, setTurnMetrics] = useState<TurnMetrics[]>([]);
  const [expandedReasons, setExpandedReasons] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useMemo(() => params.sessionId, [params.sessionId]);

  useEffect(() => {
    let isMounted = true;

    const loadResults = async () => {
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
        metricsResult,
        turnMetricsResult,
        departmentResult
      ] = await Promise.all([
        fetchScenarioById(sessionData.scenario_id),
        fetchTurnsBySessionId(sessionId),
        fetchSessionMetrics(sessionId),
        fetchTurnMetricsBySessionId(sessionId),
        sessionData.department_id
          ? fetchDepartmentById(sessionData.department_id)
          : Promise.resolve({ data: null, error: null })
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

      if (departmentResult?.error) {
        errorMessage = errorMessage ?? departmentResult.error;
        setDepartment(null);
      } else {
        setDepartment(departmentResult?.data ?? null);
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
        setMetrics(metricsResult.data);
      }

      if (turnMetricsResult.error) {
        errorMessage = errorMessage ?? turnMetricsResult.error;
        setTurnMetrics([]);
      } else {
        setTurnMetrics(turnMetricsResult.data ?? []);
      }

      setSession(sessionData);
      setError(errorMessage);
      setIsLoading(false);
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Loading results...</h1>
        <p className="mt-2 text-sm text-slate-300">
          Pulling the summary and transcript.
        </p>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Results Not Found</h1>
        <p className="mt-2 text-sm text-slate-300">
          There is no summary yet for this session.
        </p>
      </div>
    );
  }

  const coachTurns = turns.filter((turn) => turn.role === "coach");
  const coachCategoryCounts = coachTurns.reduce<Record<string, number>>(
    (acc, turn) => {
      const category = turn.coach_category;
      if (!category) {
        return acc;
      }
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const primaryCoachingFocus = Object.entries(coachCategoryCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const latestCoachRewrites = coachTurns
    .filter((turn) => Boolean(turn.coach_rewrite))
    .slice()
    .reverse()
    .slice(0, 2)
    .map((turn) => turn.coach_rewrite ?? "");
  let readinessLabel = "Developing";
  if (metrics) {
    if (
      metrics.escalation_level <= scoringConfig.readiness.ready.escalationMax &&
      metrics.empathy_score >= scoringConfig.readiness.ready.empathyMin
    ) {
      readinessLabel = "Ready";
    } else if (
      metrics.escalation_level >= scoringConfig.readiness.needsSupport.escalationMin
    ) {
      readinessLabel = "Needs support";
    }
  }

  const formatReason = (
    reason: TurnMetrics["reasons"][number]
  ): string => {
    if (typeof reason === "string") {
      return reason;
    }
    return `${reason.metric}:${reason.delta >= 0 ? "+" : ""}${reason.delta} ${reason.rule}`;
  };

  const toggleReasons = (turnId: string) => {
    setExpandedReasons((prev) => ({
      ...prev,
      [turnId]: !prev[turnId]
    }));
  };

  const getCoachBadge = (content: string): string | null => {
    const line = content.split("\n")[0] ?? "";
    if (!line.startsWith("Category: ")) {
      return null;
    }
    return line.replace("Category: ", "").trim();
  };

  const formatScenarioType = (
    scenarioType: Session["scenario_type"] | Scenario["scenario_type"]
  ) => {
    if (!scenarioType) {
      return "Unspecified";
    }
    return scenarioType
      .split("_")
      .map((part) => part[0] + part.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Session Results
        </div>
        <h1 className="mt-2 text-2xl font-semibold">{scenario.title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Summary for session {session.id}.
        </p>
        {department && (
          <p className="mt-2 text-sm text-slate-400">
            Department: {department.name} · Scenario type:{" "}
            {formatScenarioType(session.scenario_type ?? scenario.scenario_type)}
          </p>
        )}
      </section>

      {error && (
        <section className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Session Summary</h2>
        <p className="mt-3 text-sm text-slate-300">
          Summary details will appear here once the simulation is complete.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div>Department: {department?.name ?? "Unassigned"}</div>
          <div>
            Scenario type:{" "}
            {formatScenarioType(session.scenario_type ?? scenario.scenario_type)}
          </div>
          <div>Outcome: {session.outcome}</div>
          <div>Turns recorded: {session.turn_count}</div>
          <div>Empathy: {metrics ? `${metrics.empathy_score}/100` : "N/A"}</div>
          <div>Clarity: {metrics ? `${metrics.clarity_score}/100` : "N/A"}</div>
          <div>
            Boundaries: {metrics ? `${metrics.boundary_score}/100` : "N/A"}
          </div>
          <div>
            Escalation:{" "}
            {metrics ? `Level ${metrics.escalation_level}/5` : "N/A"}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Coach Summary</h2>
        {coachTurns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">
            No coaching feedback generated for this session.
          </p>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div>
              Primary coaching focus: {primaryCoachingFocus ?? "Reinforce"}
            </div>
            <div>Final readiness: {readinessLabel}</div>
            <div>
              Top rewrites:
              <div className="mt-2 space-y-2">
                {latestCoachRewrites.map((rewrite, index) => (
                  <div
                    key={`${index}-${rewrite.slice(0, 12)}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200"
                  >
                    {rewrite}
                  </div>
                ))}
                {latestCoachRewrites.length === 0 && (
                  <div className="text-sm text-slate-400">
                    No rewrite suggestions captured yet.
                  </div>
                )}
              </div>
            </div>
            <div>
              Coach entries:
              <div className="mt-2 space-y-2">
                {coachTurns.map((turn) => (
                  <div
                    key={turn.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {turn.created_at}
                    </div>
                    <div className="mt-2">
                      {getCoachBadge(turn.content) ?? "Category: Unavailable"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Metrics by Turn</h2>
        <div className="mt-4 space-y-3">
          {turns
            .filter((turn) => turn.role === "user")
            .map((turn) => {
              const metricsRow = turnMetrics.find(
                (metric) => metric.turn_id === turn.id
              );
              const reasons = metricsRow?.reasons ?? null;
              const canShowReasons =
                Array.isArray(reasons) && reasons.length > 0;
              const isExpanded = Boolean(expandedReasons[turn.id]);
              return (
                <div
                  key={turn.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {turn.created_at}
                  </div>
                  <div className="mt-2">
                    E:{metricsRow?.empathy_delta ?? 0} C:
                    {metricsRow?.clarity_delta ?? 0} B:
                    {metricsRow?.boundary_delta ?? 0} Esc:
                    {metricsRow?.escalation_delta ?? 0}
                  </div>
                  {canShowReasons && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => toggleReasons(turn.id)}
                        className="text-xs font-semibold uppercase tracking-wide text-cyan-300"
                      >
                        {isExpanded ? "Hide Why" : "Why?"}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2 text-xs text-slate-300">
                          {reasons.map((reason, index) => (
                            <div
                              key={`${turn.id}-${index}`}
                              className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2"
                            >
                              {formatReason(reason)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          {turns.filter((turn) => turn.role === "user").length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              No user turns captured yet.
            </div>
          )}
          {coachTurns.length > 0 && (
            <div className="pt-2 text-xs uppercase tracking-wide text-slate-500">
              Coach entries
            </div>
          )}
          {coachTurns.map((turn) => (
            <div
              key={turn.id}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-slate-200"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {turn.created_at}
              </div>
              <div className="mt-2">
                {getCoachBadge(turn.content) ?? "Category: Unavailable"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Transcript</h2>
        <div className="mt-4 space-y-3">
          {turns.map((turn) => {
            const baseClasses = "rounded-lg p-4";
            const roleClasses =
              turn.role === "coach"
                ? "border border-emerald-500/40 bg-emerald-500/10"
                : turn.role === "patient"
                ? "border border-amber-500/40 bg-amber-500/10"
                : turn.role === "system"
                ? "border border-slate-700 bg-slate-950/60"
                : "bg-slate-950/60";
            const roleLabel = turn.role.toUpperCase();

            return (
              <div key={turn.id} className={`${baseClasses} ${roleClasses}`}>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {roleLabel} · {turn.created_at}
                </div>
                <p className="mt-2 text-sm text-slate-100">{turn.content}</p>
              </div>
            );
          })}
          {turns.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              Transcript not available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
