import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient, CHAT_CONFIG } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type {
  CoachAnalysisRequest,
  CoachAnalysisResponse,
} from "@/lib/types/coach";
import type { OnboardingProfile } from "@/lib/types/database";

const coachAnalysisRequestSchema: z.ZodType<CoachAnalysisRequest> = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  context: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(2000).optional()
  ),
});

const suggestedReplySchema = z.object({
  tone: z.string().min(1),
  text: z.string().min(1),
  why: z.string().min(1),
});

const coachAnalysisResponseSchema: z.ZodType<CoachAnalysisResponse> = z.object({
  decoded_meaning: z.string().min(1),
  social_cues: z.array(z.string().min(1)).min(2).max(4),
  tone: z.string().min(1),
  flags: z.object({
    green: z.array(z.string().min(1)),
    yellow: z.array(z.string().min(1)),
    red: z.array(z.string().min(1)),
  }),
  suggested_replies: z.array(suggestedReplySchema).length(3),
  coaching_tip: z.string().min(1),
});

function buildSystemPrompt(
  preferredCoachingStyle: NonNullable<
    OnboardingProfile["preferred_coaching_style"]
  >,
  context?: string
) {
  return `You are Cuetie, a dating communication coach for autistic adults.
You help users understand messages they receive on dating apps.
Your coaching style is: ${preferredCoachingStyle}

The user received this message and wants help understanding it and knowing how to respond.

${context ? `Context about the situation: ${context}

` : ""}Analyze the message and return a JSON object with EXACTLY this structure:
{
  "decoded_meaning": "What this message likely means, explained clearly and concretely",
  "social_cues": ["List 2-4 social cues or signals in the message, explained plainly"],
  "tone": "The overall tone in 1-3 words (e.g., 'friendly and curious', 'casually interested', 'lukewarm')",
  "flags": {
    "green": ["Positive signals that suggest genuine interest"],
    "yellow": ["Things to be aware of but not worry about"],
    "red": ["Warning signs, if any — empty array if none"]
  },
  "suggested_replies": [
    { "tone": "warm", "text": "A warm, friendly reply option", "why": "Brief explanation of why this works" },
    { "tone": "playful", "text": "A lighter, more playful option", "why": "Brief explanation" },
    { "tone": "direct", "text": "A clear, straightforward option", "why": "Brief explanation" }
  ],
  "coaching_tip": "One specific, actionable insight for this situation"
}

Important:
- Explain social cues CONCRETELY — don't assume the user can read between the lines
- Flag explanations should be specific to THIS message, not generic advice
- Suggested replies should feel natural, not scripted
- Keep decoded_meaning under 2 sentences
- Return ONLY valid JSON, no markdown`;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const parsed = coachAnalysisRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { message, context } = parsed.data;

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

    const { data: userRecord } = await supabase
      .from("users")
      .select("onboarding_profile")
      .eq("id", user.id)
      .single<{ onboarding_profile: OnboardingProfile }>();

    const preferredCoachingStyle =
      userRecord?.onboarding_profile?.preferred_coaching_style ?? "gentle";

    const completion = await getOpenAIClient().chat.completions.create({
      model: CHAT_CONFIG.model,
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.max_tokens,
      response_format: CHAT_CONFIG.response_format,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(preferredCoachingStyle, context),
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "OpenAI returned an empty analysis response",
          },
        },
        { status: 502 }
      );
    }

    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("[coach/analyze] Failed to parse OpenAI JSON response:", {
        error,
        content,
      });

      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "Failed to parse analysis response from OpenAI",
          },
        },
        { status: 502 }
      );
    }

    const parsedResponse = coachAnalysisResponseSchema.safeParse(parsedContent);

    if (!parsedResponse.success) {
      console.error(
        "[coach/analyze] OpenAI response failed validation:",
        parsedResponse.error.issues
      );

      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "OpenAI returned an invalid analysis response",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json<CoachAnalysisResponse>(parsedResponse.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
