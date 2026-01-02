"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchActiveDepartments } from "../lib/db/departments";
import { fetchPublishedScenarios } from "../lib/db/scenarios";
import { createSession } from "../lib/db/sessions";
import { upsertSessionMetrics } from "../lib/db/metrics";
import { createTurn } from "../lib/db/turns";
import { getAnonId } from "../lib/anonId";
import { SCENARIO_TYPES } from "../lib/types";
import type { Department, Scenario, ScenarioType } from "../lib/types";

export default function ScenarioLibraryPage() {
  const router = useRouter();
  const isDebug = process.env.NEXT_PUBLIC_DEBUG_AI === "1";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [selectedScenarioType, setSelectedScenarioType] = useState<
    ScenarioType | ""
  >("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const selectedDepartment =
    departments.find((department) => department.id === selectedDepartmentId) ??
    null;

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      const { data, error: fetchError } = await fetchActiveDepartments();
      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError(fetchError);
        setDepartments([]);
      } else {
        setError(null);
        setDepartments(data ?? []);
      }
      setIsLoadingDepartments(false);
    };

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadScenarios = async () => {
      if (!selectedDepartmentId) {
        setScenarios([]);
        setSelectedScenarioId("");
        setSelectedScenarioType("");
        setIsLoadingScenarios(false);
        return;
      }

      setIsLoadingScenarios(true);
      const { data, error: fetchError } = await fetchPublishedScenarios({
        departmentId: selectedDepartmentId,
        scenarioType: selectedScenarioType || undefined
      });
      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError(fetchError);
        setScenarios([]);
      } else {
        setError(null);
        setScenarios(data ?? []);
      }
      setIsLoadingScenarios(false);
    };

    loadScenarios();

    return () => {
      isMounted = false;
    };
  }, [selectedDepartmentId, selectedScenarioType]);

  useEffect(() => {
    if (!isDebug) {
      return;
    }
    const params = new URLSearchParams();
    if (selectedDepartmentId) {
      params.set("departmentId", selectedDepartmentId);
    }
    if (selectedScenarioType) {
      params.set("scenarioType", selectedScenarioType);
    }
    const query = params.toString();
    fetch(`/api/dev/scenario-counts${query ? `?${query}` : ""}`).catch(() => {});
  }, [isDebug, selectedDepartmentId, selectedScenarioType, departments.length, scenarios.length]);

  const formatScenarioType = (scenarioType: Scenario["scenario_type"]) => {
    if (!scenarioType) {
      return "Unspecified";
    }
    return scenarioType
      .split("_")
      .map((part) => part[0] + part.slice(1).toLowerCase())
      .join(" ");
  };

  const handleStart = async () => {
    if (!selectedScenario) {
      return;
    }
    if (!selectedScenario.department_id) {
      setError("Selected scenario is missing a department assignment.");
      return;
    }
    if (!selectedScenario.scenario_type) {
      setError("Selected scenario is missing a scenario type.");
      return;
    }

    setIsStarting(true);
    setError(null);

    const anonId = getAnonId();
    if (!anonId) {
      setError("Anonymous id unavailable in this environment.");
      setIsStarting(false);
      return;
    }

    const { data, error: createError } = await createSession(
      {
        scenarioId: selectedScenario.id,
        departmentId: selectedScenario.department_id,
        scenarioType: selectedScenario.scenario_type,
        anonId
      }
    );

    if (createError || !data) {
      setError(createError ?? "Unable to start session.");
      setIsStarting(false);
      return;
    }

    const scenarioSummary =
      selectedScenario.summary ?? selectedScenario.description;
    const openingLine = scenarioSummary
      ? `Begin ${selectedScenario.title}: ${scenarioSummary}`
      : `Begin ${selectedScenario.title}.`;
    const { error: turnError } = await createTurn(
      data.id,
      "system",
      openingLine,
      { source: "system" }
    );

    if (turnError) {
      setError(turnError);
      setIsStarting(false);
      return;
    }

    const { error: metricsError } = await upsertSessionMetrics(data.id);
    if (metricsError) {
      setError(metricsError);
      setIsStarting(false);
      return;
    }

    router.push(`/sim/${data.id}`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Start Simulation</h1>
        <p className="mt-2 text-sm text-slate-300">
          Choose a department and scenario before launching a session.
        </p>
      </section>

      {isLoadingDepartments && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
          Loading departments...
        </section>
      )}

      {error && (
        <section className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </section>
      )}

      {!isLoadingDepartments && !error && departments.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300">
          No active departments available yet.
        </section>
      )}

      {!isLoadingDepartments && departments.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-slate-200">
              Department
              <select
                value={selectedDepartmentId}
                onChange={(event) => {
                  setSelectedDepartmentId(event.target.value);
                  setSelectedScenarioId("");
                  setSelectedScenarioType("");
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-200">
              Scenario Type
              <select
                value={selectedScenarioType}
                onChange={(event) => {
                  setSelectedScenarioType(event.target.value as ScenarioType | "");
                  setSelectedScenarioId("");
                }}
                disabled={!selectedDepartmentId || isLoadingScenarios}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isLoadingScenarios ? "Loading types..." : "All scenario types"}
                </option>
                {SCENARIO_TYPES.map((scenarioType) => (
                  <option key={scenarioType} value={scenarioType}>
                    {formatScenarioType(scenarioType)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-200">
              Scenario
              <select
                value={selectedScenarioId}
                onChange={(event) => setSelectedScenarioId(event.target.value)}
                disabled={!selectedDepartmentId || isLoadingScenarios}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isLoadingScenarios
                    ? "Loading scenarios..."
                    : "Select scenario"}
                </option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!selectedDepartmentId && (
            <p className="mt-3 text-xs text-slate-400">
              Select a department to see available scenarios.
            </p>
          )}

          {selectedDepartmentId &&
            !isLoadingScenarios &&
            scenarios.length === 0 && (
              <p className="mt-3 text-xs text-slate-400">
                No scenarios available for this selection yet.
              </p>
            )}
          {isDebug &&
            selectedDepartmentId &&
            !isLoadingScenarios &&
            scenarios.length === 0 && (
              <p className="mt-1 text-xs text-amber-300/80">
                No scenarios found. Check seed applied / is_active / scenario_type mismatch.
              </p>
            )}

          {selectedScenario && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {formatScenarioType(selectedScenario.scenario_type)} /{" "}
                {selectedScenario.difficulty ?? "Standard"}
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedScenario.title}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {selectedScenario.summary ??
                  selectedScenario.description ??
                  "No summary provided yet."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedScenario.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {!selectedDepartmentId || !selectedScenarioId
                ? "Select a department and scenario to start."
                : selectedDepartment
                ? `Starting in ${selectedDepartment.name}.`
                : "Ready to start."}
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-cyan-400 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedScenarioId || isStarting}
            >
              {isStarting ? "Starting..." : "Start Simulation"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
