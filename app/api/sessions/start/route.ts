import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse, StartSessionResponse } from "@/lib/types/api";
import type { Message, Scenario, Session } from "@/lib/types/database";

const startSessionSchema = z.object({
  scenarioId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // --- Validate body ---
    const body = await request.json();
    const parsed = startSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { scenarioId } = parsed.data;

    // --- Authenticate ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Fetch scenario ---
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single<Scenario>();

    if (scenarioError || !scenario) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Scenario not found" } },
        { status: 404 }
      );
    }

    // --- Create session ---
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        scenario_id: scenarioId,
        mode: "text" as const,
        status: "active" as const,
      })
      .select("*")
      .single<Session>();

    if (sessionError || !session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "DB_ERROR", message: "Failed to create session" } },
        { status: 500 }
      );
    }

    // --- Create opening message ---
    const { data: openingMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        session_id: session.id,
        role: "partner" as const,
        content: scenario.opening_message,
      })
      .select("*")
      .single<Message>();

    if (messageError || !openingMessage) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "DB_ERROR", message: "Failed to create opening message" } },
        { status: 500 }
      );
    }

    // --- Update session message count ---
    await supabase
      .from("sessions")
      .update({ message_count: 1 })
      .eq("id", session.id);

    return NextResponse.json<StartSessionResponse>({
      session: { ...session, message_count: 1 },
      scenario,
      openingMessage,
    });
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
