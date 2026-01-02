// app/api/sim/next/route.ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildCoachResponse } from "../../../../lib/coach";
import { buildDeesRuntimePrompt } from "../../../../lib/deesRuntime";
import { getSupabaseClient } from "../../../../lib/supabaseClient";
import type { DeesRuntimePrompt } from "../../../../lib/deesRuntime";
import type { SessionMetrics, TurnMetrics } from "../../../../lib/types";

type ReqBody = {
  sessionId: string;
  metrics?: SessionMetrics;
  lastTurnMetrics?: {
    empathy_delta: number;
    clarity_delta: number;
    boundary_delta: number;
    escalation_delta: number;
    reasons?: unknown;
  };
  debugRuntimePrompt?: boolean;
  debugEscalationOverride?: number | null;
};

type CoachPayload = {
  category: string;
  tip: string;
  rewrite: string;
  next_step: string;
  why: string;
  deltas: string;
};

const PROMPT_PATH = path.join(
  process.cwd(),
  "docs",
  "prompts",
  "dees_engine.md"
);

function readPromptFile(): string {
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDeltaBadges(metrics: ReqBody["lastTurnMetrics"]): string {
  const formatValue = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
  return [
    `ΔE:${formatValue(metrics?.empathy_delta ?? 0)}`,
    `ΔC:${formatValue(metrics?.clarity_delta ?? 0)}`,
    `ΔB:${formatValue(metrics?.boundary_delta ?? 0)}`,
    `ΔEsc:${formatValue(metrics?.escalation_delta ?? 0)}`
  ].join(" ");
}

function buildTurnMetricsForCoach(
  lastTurnMetrics: ReqBody["lastTurnMetrics"]
): TurnMetrics {
  return {
    id: "ai",
    session_id: "ai",
    turn_id: "ai",
    empathy_delta: lastTurnMetrics?.empathy_delta ?? 0,
    clarity_delta: lastTurnMetrics?.clarity_delta ?? 0,
    boundary_delta: lastTurnMetrics?.boundary_delta ?? 0,
    escalation_delta: lastTurnMetrics?.escalation_delta ?? 0,
    reasons: Array.isArray(lastTurnMetrics?.reasons)
      ? lastTurnMetrics?.reasons
      : null,
    created_at: new Date().toISOString()
  };
}

function buildCoachPayload(
  lastTurnMetrics: ReqBody["lastTurnMetrics"],
  userTurnCount: number
): CoachPayload {
  const deltaBadges = formatDeltaBadges(lastTurnMetrics);
  const coachTurnMetrics = buildTurnMetricsForCoach(lastTurnMetrics);
  const fallback = buildCoachResponse(coachTurnMetrics, userTurnCount);
  return {
    category: fallback.category || "Neutral",
    tip:
      fallback.tip ||
      "Lead with validation and a clear next step.",
    rewrite:
      fallback.rewrite ||
      "I hear you. Here's what I can do next: [action]. I'll update you in [time].",
    next_step:
      fallback.nextStep || "Next step: ask one clarifying question.",
    why: "delta based on scoring rules",
    deltas: deltaBadges
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    let systemPrompt = "";
    let promptHash = "";
    let aiAttempted = false;
    let aiSucceeded = false;
    let source: "ai" | "repaired" | "heuristic" = "heuristic";
    const model = process.env.DEES_MODEL || "gpt-4.1";
    let runtimePrompt: DeesRuntimePrompt | null = null;

    try {
      systemPrompt = readPromptFile();
      promptHash = hashPrompt(systemPrompt);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          "Missing prompt file: docs/prompts/dees_engine.md"
        );
      }
      systemPrompt =
        "You are a safe, calm ED patient simulation. Respond briefly.";
      promptHash = hashPrompt(systemPrompt);
      const coach = buildCoachPayload(body.lastTurnMetrics, 0);
      const patient = "(Patient response unavailable - AI offline.)";
      return NextResponse.json({
        patient,
        coach,
        metrics: body.metrics ?? null,
        lastTurnMetrics: body.lastTurnMetrics ?? null,
        meta: {
          ai_attempted: false,
          ai_succeeded: false,
          model,
          prompt_hash: promptHash,
          prompt_path: "docs/prompts/dees_engine.md",
          source: "heuristic"
        }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ error: "Supabase client not configured." }, { status: 500 });
    }

    const { data: sessionData, error: sessionError } = await client
      .from("sessions")
      .select("id, scenario_id, department_id")
      .eq("id", body.sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const [
      { data: scenarioData, error: scenarioError },
      { data: departmentData, error: departmentError },
      turnsResult
    ] = await Promise.all([
      client
        .from("scenarios")
        .select(
          "id, scenario_type, title, summary, description, tags, persona_seed, constraints_refs"
        )
        .eq("id", sessionData.scenario_id)
        .single(),
      sessionData.department_id
        ? client
            .from("departments")
            .select("id, name, code, description")
            .eq("id", sessionData.department_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      client
        .from("turns")
        .select("id, role, content, created_at")
        .eq("session_id", body.sessionId)
        .order("created_at", { ascending: true })
    ]);

    if (scenarioError || !scenarioData) {
      return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
    }

    if (departmentError) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const turns = turnsResult.data ?? [];
    const userTurnCount = turns.filter((turn) => turn.role === "user").length;
    runtimePrompt = buildDeesRuntimePrompt({
      session: sessionData,
      scenario: scenarioData,
      department: departmentData,
      turns,
      metrics: body.metrics ?? null,
      turnIndex: userTurnCount,
      escalationLevelOverride: body.debugEscalationOverride ?? null
    });

    // IMPORTANT: tell the model to output JSON only.
    const userPrompt = {
      runtime_prompt: runtimePrompt,
      output_contract: "Return ONLY valid JSON with key: patient."
    };

    // Call OpenAI (use your preferred client; this is fetch-based and simple)
    aiAttempted = true;
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: Number(process.env.DEES_TEMPERATURE ?? "0.6"),
        input: [
          { role: "system", content: systemPrompt + "\n\nOUTPUT MUST BE JSON ONLY." },
          { role: "user", content: JSON.stringify(userPrompt) }
        ]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: "OpenAI error", detail: errText }, { status: 500 });
    }

    const data = await resp.json();

    // Depending on API shape, the text may be in different places.
    // We’ll try common paths; Codex can refine this after you run it once.
    const text =
      data.output_text ??
      data?.output?.[0]?.content?.[0]?.text ??
      data?.response?.output_text;

    if (!text) {
      return NextResponse.json({ error: "No model text returned", raw: data }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Model did not return valid JSON", text }, { status: 500 });
    }

    const patient = isNonEmptyString(parsed?.patient)
      ? parsed.patient.trim()
      : "(Patient response unavailable - AI offline.)";
    const userTurnIndex = runtimePrompt?.meta.turn_index ?? 0;
    const coach = buildCoachPayload(body.lastTurnMetrics, userTurnIndex);
    aiSucceeded = isNonEmptyString(parsed?.patient);
    source = aiSucceeded ? "ai" : "repaired";

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `sim-next session=${body.sessionId} source=${source} model=${model} prompt=${promptHash.slice(
          0,
          8
        )}`
      );
    }

    if (process.env.NODE_ENV !== "production" && body.debugRuntimePrompt) {
      console.log("[dees-runtime]", JSON.stringify(runtimePrompt, null, 2));
    }

    const responseMetrics = body.metrics ?? null;
    const responseLastTurnMetrics = body.lastTurnMetrics ?? null;

    if (process.env.NODE_ENV !== "production" && responseMetrics) {
      console.log(
        `[sim-next metrics] E=${responseMetrics.empathy_score} C=${responseMetrics.clarity_score} B=${responseMetrics.boundary_score} Esc=${responseMetrics.escalation_level}`
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[sim-next coach]",
        JSON.stringify({
          category: coach.category,
          has_tip: Boolean(coach.tip),
          has_why: Boolean(coach.why),
          has_rewrite: Boolean(coach.rewrite),
          has_next_step: Boolean(coach.next_step)
        })
      );
    }

    return NextResponse.json({
      patient,
      coach,
      metrics: responseMetrics,
      lastTurnMetrics: responseLastTurnMetrics,
      runtime_prompt: body.debugRuntimePrompt ? runtimePrompt : null,
      meta: {
        ai_attempted: aiAttempted,
        ai_succeeded: aiSucceeded,
        model,
        prompt_hash: promptHash,
        prompt_path: "docs/prompts/dees_engine.md",
        source
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
