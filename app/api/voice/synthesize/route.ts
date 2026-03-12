import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, TTS_CONFIG, getVoiceForPreference } from "@/lib/ai/config";
import type { ErrorResponse } from "@/lib/types/api";
import type { OnboardingProfile } from "@/lib/types/database";

const synthesizeSchema = z.object({
  text: z.string().min(1).max(4096),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // --- Authenticate ---
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Validate body ---
    const body = await request.json();
    const parsed = synthesizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { text, sessionId } = parsed.data;

    // --- Verify session ownership ---
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    // --- Get user's dating preference for voice selection ---
    const { data: userRecord } = await supabase
      .from("users")
      .select("onboarding_profile")
      .eq("id", user.id)
      .single<{ onboarding_profile: OnboardingProfile }>();

    const voice = getVoiceForPreference(
      userRecord?.onboarding_profile?.dating_preference
    );

    // --- Call OpenAI TTS ---
    const openai = getOpenAIClient();
    const audioResponse = await openai.audio.speech.create({
      model: TTS_CONFIG.model,
      voice,
      input: text,
      response_format: TTS_CONFIG.responseFormat,
      speed: TTS_CONFIG.speed,
    });

    // --- Stream audio back ---
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Speech synthesis failed";
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
