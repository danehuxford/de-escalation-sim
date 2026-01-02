import { getSupabaseClient } from "../supabaseClient";
import type { Turn } from "../types";

export async function fetchTurnsBySessionId(
  sessionId: string
): Promise<{ data: Turn[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return { data: (data as Turn[]) ?? null, error: error?.message ?? null };
}

export async function createTurn(
  sessionId: string,
  role: Turn["role"],
  content: string,
  options?: {
    source?: Turn["source"];
    model?: string | null;
    prompt_hash?: string | null;
  }
): Promise<{ data: Turn | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turns")
    .insert({
      session_id: sessionId,
      role,
      content,
      source: options?.source ?? null,
      model: options?.model ?? null,
      prompt_hash: options?.prompt_hash ?? null
    })
    .select("*")
    .single();

  return { data: (data as Turn) ?? null, error: error?.message ?? null };
}

export async function createCoachTurn(
  sessionId: string,
  content: string,
  coachCategory: string,
  coachTip: string,
  coachRewrite: string,
  options?: {
    source?: Turn["source"];
    model?: string | null;
    prompt_hash?: string | null;
  }
): Promise<{ data: Turn | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("turns")
    .insert({
      session_id: sessionId,
      role: "coach",
      content,
      coach_category: coachCategory,
      coach_tip: coachTip,
      coach_rewrite: coachRewrite,
      source: options?.source ?? null,
      model: options?.model ?? null,
      prompt_hash: options?.prompt_hash ?? null
    })
    .select("*")
    .single();

  return { data: (data as Turn) ?? null, error: error?.message ?? null };
}
