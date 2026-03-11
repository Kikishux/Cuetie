import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type { Message, Scenario, Session } from "@/lib/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // --- Authenticate ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Fetch session & verify ownership ---
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single<Session>();

    if (sessionError || !session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    // --- Fetch messages ---
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .returns<Message[]>();

    // --- Fetch scenario ---
    const { data: scenario } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", session.scenario_id)
      .single<Scenario>();

    return NextResponse.json({ session, scenario, messages: messages ?? [] });
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
