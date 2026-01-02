import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../lib/supabaseClient";

const METRIC_OPTIONS = ["empathy", "clarity", "boundaries", "de-escalation"] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];

type CoachMeRequest = {
  sessionId?: string;
  selectedMetric?: MetricOption;
  selectedStrength?: 1 | 2 | 3;
  selectedVariability?: "low" | "medium" | "high";
};

type Suggestion = {
  id: "light" | "medium" | "strong";
  strength: 1 | 2 | 3;
  label: string;
  phrase: string;
};

const fallbackSuggestions: Record<MetricOption, Suggestion[]> = {
  empathy: [
    {
      id: "light",
      strength: 1,
      label: "Light coaching nudge",
      phrase: "I hear you. This is stressful, and I want to help."
    },
    {
      id: "medium",
      strength: 2,
      label: "Medium coaching nudge",
      phrase: "I can see why this feels upsetting. Thank you for telling me what's going on."
    },
    {
      id: "strong",
      strength: 3,
      label: "Strong coaching nudge",
      phrase: "I understand this is really hard right now. I'm here with you, and I'm listening."
    }
  ],
  clarity: [
    {
      id: "light",
      strength: 1,
      label: "Light coaching nudge",
      phrase: "Here's what I'm going to do next, and I'll check back shortly."
    },
    {
      id: "medium",
      strength: 2,
      label: "Medium coaching nudge",
      phrase: "Here's what will happen next: I'll [action], then I'll be back in [time]."
    },
    {
      id: "strong",
      strength: 3,
      label: "Strong coaching nudge",
      phrase: "First I'll [action]. Then I'll return in [time] to update you on what's next."
    }
  ],
  boundaries: [
    {
      id: "light",
      strength: 1,
      label: "Light coaching nudge",
      phrase: "I want to help, and I need us to keep this calm so we can move forward."
    },
    {
      id: "medium",
      strength: 2,
      label: "Medium coaching nudge",
      phrase: "I can't do that, but what I can do is [helpful action] right now."
    },
    {
      id: "strong",
      strength: 3,
      label: "Strong coaching nudge",
      phrase: "I can't allow that behavior, but I will stay with you and explain the next step."
    }
  ],
  "de-escalation": [
    {
      id: "light",
      strength: 1,
      label: "Light coaching nudge",
      phrase: "Let's take a breath together. I'm here to help you."
    },
    {
      id: "medium",
      strength: 2,
      label: "Medium coaching nudge",
      phrase: "I hear you. Let's slow this down so I can help. Here are two options we can do next."
    },
    {
      id: "strong",
      strength: 3,
      label: "Strong coaching nudge",
      phrase: "I want to help, and I need us to lower the intensity. We can do option A or option B next."
    }
  ]
};

function isMetricOption(value: string): value is MetricOption {
  return (METRIC_OPTIONS as readonly string[]).includes(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CoachMeRequest;
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const metricRaw = body.selectedMetric ?? "empathy";
    const selectedMetric = isMetricOption(metricRaw) ? metricRaw : "empathy";
    const selectedStrength = body.selectedStrength ?? 1;
    const selectedVariability = body.selectedVariability ?? "medium";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ error: "Supabase client not configured." }, { status: 500 });
    }

    const { data: sessionData, error: sessionError } = await client
      .from("sessions")
      .select("id, scenario_id, turn_count")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const [{ data: scenarioData }, turnsResult, metricsResult, deltasResult] =
      await Promise.all([
        client
          .from("scenarios")
          .select("id, title, description, difficulty, tags")
          .eq("id", sessionData.scenario_id)
          .single(),
        client
          .from("turns")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
        client
          .from("session_metrics")
          .select("empathy_score, clarity_score, boundary_score, escalation_level")
          .eq("session_id", sessionId)
          .single(),
        client
          .from("turn_metrics")
          .select("empathy_delta, clarity_delta, boundary_delta, escalation_delta")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(3)
      ]);

    const transcript = (turnsResult?.data ?? []).map((turn) => ({
      role: turn.role,
      content: turn.content
    }));

    const recentUserPhrases = (turnsResult?.data ?? [])
      .filter((turn) => turn.role === "user")
      .slice(-6)
      .map((turn) => turn.content.trim())
      .filter(Boolean);

    const userPrompt = {
      sessionId,
      selectedMetric,
      selectedStrength,
      selectedVariability,
      scenario: scenarioData ?? null,
      transcript,
      metrics: metricsResult?.data ?? null,
      recentDeltas: deltasResult?.data ?? [],
      avoidPhrases: recentUserPhrases,
      output_contract:
        "Return ONLY valid JSON with keys: metric, suggestions[{id,strength,label,phrase}]"
    };

    const systemPrompt = `You are a coaching assistant for ED de-escalation training.\nRules:\n- Provide communication coaching only. No medical advice, no diagnoses, no medication instructions.\n- Generate exactly three phrase options: Light (+1), Medium (+2), Strong (+3).\n- Each phrase must be 1-2 sentences, realistic for ED staff, and aligned to the selected metric only.\n- Avoid repeating phrases already used by the learner.\n- Respect any promised timeframes or actions.\n- Output JSON only.`;
    const temperature =
      selectedVariability === "high"
        ? 1.0
        : selectedVariability === "low"
        ? 0.2
        : 0.6;

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.COACH_MODEL || "gpt-4.1",
        temperature,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) }
        ]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: "OpenAI error", detail: errText }, { status: 500 });
    }

    const data = await resp.json();
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

    const suggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
          .filter((item: any) => typeof item?.phrase === "string")
          .slice(0, 3)
          .map((item: any, index: number) => {
            const strength = [1, 2, 3][index] as 1 | 2 | 3;
            const id = strength === 1 ? "light" : strength === 2 ? "medium" : "strong";
            const label =
              strength === 1
                ? "Light coaching nudge"
                : strength === 2
                ? "Medium coaching nudge"
                : "Strong coaching nudge";
            return {
              id,
              strength,
              label,
              phrase: String(item.phrase).trim()
            } as Suggestion;
          })
      : [];

    const finalSuggestions = suggestions.length === 3
      ? suggestions
      : fallbackSuggestions[selectedMetric];

    return NextResponse.json({
      metric: selectedMetric,
      suggestions: finalSuggestions
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
