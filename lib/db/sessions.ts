import { getSupabaseClient } from "../supabaseClient";
import type { ScenarioType, Session } from "../types";

export async function createSession(params: {
  scenarioId: string;
  departmentId: string | null;
  scenarioType: ScenarioType | null;
  anonId: string;
}): Promise<{ data: Session | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("sessions")
    .insert({
      scenario_id: params.scenarioId,
      department_id: params.departmentId,
      scenario_type: params.scenarioType,
      anon_id: params.anonId,
      outcome: "In Progress",
      turn_count: 0,
      ended_at: null
    })
    .select("*")
    .single();

  return { data: (data as Session) ?? null, error: error?.message ?? null };
}

export async function fetchSessionById(
  sessionId: string
): Promise<{ data: Session | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  return { data: (data as Session) ?? null, error: error?.message ?? null };
}

export async function incrementTurnCount(
  sessionId: string
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("sessions")
    .select("turn_count")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to load session turn count." };
  }

  const { error: updateError } = await client
    .from("sessions")
    .update({ turn_count: (data.turn_count ?? 0) + 1 })
    .eq("id", sessionId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { error: null };
}

export async function endSession(
  sessionId: string,
  summary: string
): Promise<{ data: Session | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), outcome: "Completed", summary })
    .eq("id", sessionId)
    .select("*")
    .single();

  return { data: (data as Session) ?? null, error: error?.message ?? null };
}
