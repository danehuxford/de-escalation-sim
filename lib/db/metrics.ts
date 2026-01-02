import { getSupabaseClient } from "../supabaseClient";
import { applySessionMetricDeltas } from "../scoring";
import type {
  SessionMetrics,
  TurnMetrics,
  TurnMetricsDeltas
} from "../types";

export async function upsertSessionMetrics(
  sessionId: string
): Promise<{ data: SessionMetrics | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("session_metrics")
    .upsert(
      {
        session_id: sessionId,
        empathy_score: 50,
        clarity_score: 50,
        boundary_score: 50,
        escalation_level: 2
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  return { data: (data as SessionMetrics) ?? null, error: error?.message ?? null };
}

export async function fetchSessionMetrics(
  sessionId: string
): Promise<{ data: SessionMetrics | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("session_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  return { data: (data as SessionMetrics) ?? null, error: error?.message ?? null };
}

export async function createTurnMetrics(
  sessionId: string,
  turnId: string,
  deltas: TurnMetricsDeltas,
  reasons: TurnMetrics["reasons"]
): Promise<{ data: TurnMetrics | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turn_metrics")
    .insert({
      session_id: sessionId,
      turn_id: turnId,
      empathy_delta: deltas.empathy_delta,
      clarity_delta: deltas.clarity_delta,
      boundary_delta: deltas.boundary_delta,
      escalation_delta: deltas.escalation_delta,
      reasons
    })
    .select("*")
    .single();

  return { data: (data as TurnMetrics) ?? null, error: error?.message ?? null };
}

export async function fetchTurnMetricsBySessionId(
  sessionId: string
): Promise<{ data: TurnMetrics[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turn_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return { data: (data as TurnMetrics[]) ?? null, error: error?.message ?? null };
}

export async function fetchTurnMetricsByTurnId(
  turnId: string
): Promise<{ data: TurnMetrics | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turn_metrics")
    .select("*")
    .eq("turn_id", turnId)
    .single();

  return { data: (data as TurnMetrics) ?? null, error: error?.message ?? null };
}

export async function updateSessionMetricsWithDeltas(
  sessionId: string,
  deltas: TurnMetricsDeltas
): Promise<{ data: SessionMetrics | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data: current, error: fetchError } = await client
    .from("session_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (fetchError || !current) {
    return { data: null, error: fetchError?.message ?? "Metrics not found." };
  }

  const nextMetrics = applySessionMetricDeltas(
    {
      empathy_score: current.empathy_score ?? 50,
      clarity_score: current.clarity_score ?? 50,
      boundary_score: current.boundary_score ?? 50,
      escalation_level: current.escalation_level ?? 2
    },
    deltas
  );

  const { data, error } = await client
    .from("session_metrics")
    .update({ ...nextMetrics, updated_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .select("*")
    .single();

  return { data: (data as SessionMetrics) ?? null, error: error?.message ?? null };
}
