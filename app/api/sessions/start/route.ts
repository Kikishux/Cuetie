import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse, StartSessionResponse } from "@/lib/types/api";
import type { Message, OnboardingProfile, Scenario, Session } from "@/lib/types/database";
import { getPartnerName } from "@/lib/ai/name-pools";

const startSessionSchema = z.object({
  scenarioId: z.string().min(1),
  mode: z.enum(["text", "voice"]).default("text"),
  roundType: z.enum(["quick", "standard", "deep"]).default("standard"),
  isFinetune: z.boolean().optional(),
  sourceSessionId: z.string().optional(),
  generatedScenario: z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.string(),
    category: z.string(),
    partner_persona: z.record(z.string(), z.unknown()),
    coaching_focus: z.array(z.string()),
    opening_message: z.string(),
    success_target: z.string().optional(),
  }).optional(),
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

    const { scenarioId, mode, roundType, isFinetune, sourceSessionId, generatedScenario } = parsed.data;

    // --- Authenticate ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Fetch or create scenario ---
    let scenario: Scenario | null = null;

    if (generatedScenario) {
      // Insert the generated scenario into the DB
      const { data: newScenario } = await supabase
        .from("scenarios")
        .insert({
          title: generatedScenario.title,
          description: generatedScenario.description,
          difficulty: generatedScenario.difficulty,
          category: generatedScenario.category,
          partner_persona: generatedScenario.partner_persona,
          coaching_focus: generatedScenario.coaching_focus,
          opening_message: generatedScenario.opening_message,
          is_active: false, // Don't show in browse list
          sort_order: 999,
        })
        .select("*")
        .single<Scenario>();

      scenario = newScenario;
    } else {
      const { data: fetchedScenario } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single<Scenario>();
      scenario = fetchedScenario;
    }

    if (!scenario) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Scenario not found" } },
        { status: 404 }
      );
    }

    const actualScenarioId = scenario.id;

    // --- Create session (gracefully handle missing columns) ---
    let session: Session | null = null;
    let sessionError: Error | null = null;

    const sessionInsert: Record<string, unknown> = {
      user_id: user.id,
      scenario_id: actualScenarioId,
      mode: mode as "text" | "voice",
      round_type: roundType,
      status: "active" as const,
      ...(isFinetune ? { is_finetune: true } : {}),
      ...(sourceSessionId ? { source_session_id: sourceSessionId } : {}),
    };

    const result = await supabase
      .from("sessions")
      .insert(sessionInsert)
      .select("*")
      .single<Session>();

    if (result.error) {
      // If new columns don't exist, retry without them
      const fallback = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          scenario_id: actualScenarioId,
          mode: mode as "text" | "voice",
          status: "active" as const,
        })
        .select("*")
        .single<Session>();

      session = fallback.data;
      sessionError = fallback.error as Error | null;
    } else {
      session = result.data;
    }

    if (sessionError || !session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "DB_ERROR", message: "Failed to create session" } },
        { status: 500 }
      );
    }

    // Ensure round_type is available in the response even if not stored in DB
    const sessionWithRound = { ...session, round_type: session.round_type ?? roundType };

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

    // --- Swap partner name based on dating preference ---
    const { data: userRecord } = await supabase
      .from("users")
      .select("onboarding_profile")
      .eq("id", user.id)
      .single<{ onboarding_profile: OnboardingProfile }>();

    const swappedName = getPartnerName(
      userRecord?.onboarding_profile?.dating_preference,
      scenario.sort_order
    );
    if (swappedName) {
      scenario.partner_persona = {
        ...scenario.partner_persona,
        name: swappedName,
      };
    }

    return NextResponse.json<StartSessionResponse>({
      session: { ...sessionWithRound, message_count: 1 },
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
