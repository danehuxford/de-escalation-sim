import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../lib/supabaseClient";

export async function GET(request: Request) {
  const isDebug =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEBUG_AI === "1";

  if (!isDebug) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const client = getSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase client not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");
  const scenarioType = searchParams.get("scenarioType");

  const { count: departmentCount } = await client
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  let scenariosByDepartmentMap: Record<string, number> | null = null;
  let scenariosByDepartmentCount: number | null = null;
  let scenariosByTypeCount: number | null = null;

  if (!departmentId) {
    const { data: departments } = await client
      .from("departments")
      .select("id, code")
      .eq("is_active", true);
    const { data: scenarios } = await client
      .from("scenarios")
      .select("id, department_id")
      .eq("is_active", true)
      .eq("is_published", true);

    const counts: Record<string, number> = {};
    const departmentById = new Map<string, string>();
    departments?.forEach((department) => {
      counts[department.code] = 0;
      departmentById.set(department.id, department.code);
    });
    scenarios?.forEach((scenario) => {
      const code = departmentById.get(scenario.department_id);
      if (!code) {
        return;
      }
      counts[code] = (counts[code] ?? 0) + 1;
    });
    scenariosByDepartmentMap = counts;
  }

  if (departmentId) {
    const { count } = await client
      .from("scenarios")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_published", true)
      .eq("department_id", departmentId);
    scenariosByDepartmentCount = count ?? 0;
  }

  if (departmentId && scenarioType) {
    const { count } = await client
      .from("scenarios")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_published", true)
      .eq("department_id", departmentId)
      .eq("scenario_type", scenarioType);
    scenariosByTypeCount = count ?? 0;
  }

  console.log(
    "[dev] scenario-counts",
    JSON.stringify({
      departments: departmentCount ?? 0,
      scenarios_by_department_map: scenariosByDepartmentMap,
      scenarios_by_department: scenariosByDepartmentCount,
      scenarios_by_department_and_type: scenariosByTypeCount
    })
  );

  return NextResponse.json({
    departments: departmentCount ?? 0,
    scenarios_by_department_map: scenariosByDepartmentMap,
    scenarios_by_department: scenariosByDepartmentCount,
    scenarios_by_department_and_type: scenariosByTypeCount
  });
}
