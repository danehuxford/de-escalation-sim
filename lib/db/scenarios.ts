import { getSupabaseClient } from "../supabaseClient";
import type { Scenario, ScenarioType } from "../types";

export async function fetchPublishedScenarios(options?: {
  departmentId?: string;
  scenarioType?: ScenarioType;
}): Promise<{
  data: Scenario[] | null;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  let query = client
    .from("scenarios")
    .select("*")
    .eq("is_published", true)
    .eq("is_active", true);

  if (options?.departmentId) {
    query = query.eq("department_id", options.departmentId);
  }

  if (options?.scenarioType) {
    query = query.eq("scenario_type", options.scenarioType);
  }

  const { data, error } = await query
    .order("scenario_type", { ascending: true })
    .order("title", { ascending: true });

  return { data: (data as Scenario[]) ?? null, error: error?.message ?? null };
}

export async function fetchScenarioById(
  scenarioId: string
): Promise<{ data: Scenario | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("scenarios")
    .select("*")
    .eq("id", scenarioId)
    .single();

  return { data: (data as Scenario) ?? null, error: error?.message ?? null };
}
