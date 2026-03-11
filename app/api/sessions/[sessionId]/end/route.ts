import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateScorecard, calculateSkillScores } from "@/lib/ai/scorecard-generator";
import type { EndSessionResponse, ErrorResponse } from "@/lib/types/api";
import type { Message, OnboardingProfile, Scenario, Session } from "@/lib/types/database";

export async function POST(
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

    if (session.status !== "active") {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "SESSION_ENDED", message: "Session is already completed" } },
        { status: 400 }
      );
    }

    // --- Fetch messages ---
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .returns<Message[]>();

    if (!messages || messages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NO_MESSAGES", message: "No messages found for this session" } },
        { status: 400 }
      );
    }

    // --- Fetch scenario ---
    const { data: scenario } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", session.scenario_id)
      .single<Scenario>();

    if (!scenario) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Scenario not found" } },
        { status: 404 }
      );
    }

    // --- Fetch user profile ---
    const { data: userRecord } = await supabase
      .from("users")
      .select("onboarding_profile")
      .eq("id", user.id)
      .single<{ onboarding_profile: OnboardingProfile }>();

    const userProfile: OnboardingProfile = userRecord?.onboarding_profile ?? {};

    // --- Generate scorecard ---
    const scorecard = await generateScorecard(messages, scenario, userProfile);
    const skillScores = calculateSkillScores(scorecard);

    // --- Save skill scores ---
    if (skillScores.length > 0) {
      await supabase.from("skill_scores").insert(
        skillScores.map((s) => ({
          user_id: user.id,
          session_id: sessionId,
          skill_id: s.skill_id,
          score: s.score,
        }))
      );
    }

    // --- Update session ---
    const { data: updatedSession } = await supabase
      .from("sessions")
      .update({
        status: "completed" as const,
        ended_at: new Date().toISOString(),
        scorecard,
      })
      .eq("id", sessionId)
      .select("*")
      .single<Session>();

    return NextResponse.json<EndSessionResponse>({
      scorecard,
      session: updatedSession ?? { ...session, status: "completed", scorecard },
    });
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
