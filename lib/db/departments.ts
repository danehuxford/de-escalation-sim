import { getSupabaseClient } from "../supabaseClient";
import type { Department } from "../types";

export async function fetchActiveDepartments(): Promise<{
  data: Department[] | null;
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return { data: (data as Department[]) ?? null, error: error?.message ?? null };
}

export async function fetchDepartmentById(
  departmentId: string
): Promise<{ data: Department | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not configured." };
  }

  const { data, error } = await client
    .from("departments")
    .select("*")
    .eq("id", departmentId)
    .single();

  return { data: (data as Department) ?? null, error: error?.message ?? null };
}
