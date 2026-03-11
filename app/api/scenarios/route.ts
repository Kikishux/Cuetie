import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type { Scenario } from "@/lib/types/database";

export async function GET() {
  try {
    // --- Authenticate ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Fetch active scenarios ---
    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .returns<Scenario[]>();

    if (scenariosError) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "DB_ERROR", message: "Failed to fetch scenarios" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ scenarios: scenarios ?? [] });
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
