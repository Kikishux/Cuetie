import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient, CHAT_CONFIG } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type {
  CoachAnalysisRequest,
  AmbiguityAnalysis,
} from "@/lib/types/coach";
import type { OnboardingProfile } from "@/lib/types/database";

const coachAnalysisRequestSchema: z.ZodType<CoachAnalysisRequest> = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  context: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(2000).optional()
  ),
  interaction_stage: z.enum([
    "just-matched", "early-texting", "after-first-date", "ongoing-dating", "other"
  ]).optional(),
  user_need: z.enum([
    "understand-meaning", "decide-whether-to-reply", "write-a-reply", "check-if-should-ask-directly"
  ]).optional(),
});

const goalResponseSchema = z.object({
  text: z.string().min(1),
  why: z.string().min(1),
  best_when: z.string().min(1),
});

const ambiguityAnalysisSchema: z.ZodType<AmbiguityAnalysis> = z.object({
  best_read: z.string().min(1),
  ambiguity_level: z.enum(["low", "medium", "high"]),
  best_next_move: z.string().min(1),
  literal_meaning: z.string().min(1),
  interpretations: z.array(z.object({
    label: z.string().min(1),
    support_level: z.enum(["strong", "some", "weak"]),
    explanation: z.string().min(1),
    evidence_phrases: z.array(z.string().min(1)),
  })).min(2).max(4),
  evidence_markers: z.array(z.object({
    phrase: z.string().min(1),
    could_mean: z.string().min(1),
    but_also: z.string().min(1),
  })).min(1).max(6),
  responses_by_goal: z.object({
    warm: goalResponseSchema,
    direct: goalResponseSchema,
    clarifying: goalResponseSchema,
    boundary: goalResponseSchema,
  }),
  ask_directly_scripts: z.array(z.string().min(1)).min(1).max(3),
  coaching_tip: z.string().min(1),
});

function buildSystemPrompt(
  preferredCoachingStyle: NonNullable<
    OnboardingProfile["preferred_coaching_style"]
  >,
  context?: string,
  interactionStage?: string,
  userNeed?: string,
) {
  const stageContext = interactionStage
    ? `\nInteraction stage: ${interactionStage.replace(/-/g, " ")}`
    : "";
  const needContext = userNeed
    ? `\nWhat the user needs most: ${userNeed.replace(/-/g, " ")}`
    : "";

  return `You are Cuetie, a dating communication coach for autistic adults.
You are an Ambiguity Decoder — you help users interpret unclear or confusing messages honestly, with explicit uncertainty.
Your coaching style is: ${preferredCoachingStyle}

The user received a message and wants help understanding what it really means.
${context ? `Context about the situation: ${context}` : ""}${stageContext}${needContext}

CRITICAL RULES:
- NEVER pretend certainty about ambiguous signals. State uncertainty honestly.
- Show EVIDENCE from the actual message words to support each interpretation.
- Provide multiple plausible interpretations ranked by likelihood.
- When ambiguity is high, prioritize "ask directly" as the best next move.
- Quote specific phrases from the message as evidence.
- Each interpretation must have at least one evidence phrase.

Return a JSON object with EXACTLY this structure:
{
  "best_read": "The most likely overall interpretation in one clear sentence",
  "ambiguity_level": "low" | "medium" | "high",
  "best_next_move": "One concrete recommended action",
  "literal_meaning": "What the words literally say, without reading between the lines",
  "interpretations": [
    {
      "label": "Short label like 'Genuine interest' or 'Polite but noncommittal'",
      "support_level": "strong" | "some" | "weak",
      "explanation": "Why this interpretation is plausible",
      "evidence_phrases": ["exact quoted phrases from the message that support this"]
    }
  ],
  "evidence_markers": [
    {
      "phrase": "exact phrase from the message",
      "could_mean": "One plausible meaning of this phrase",
      "but_also": "An alternative meaning of the same phrase"
    }
  ],
  "responses_by_goal": {
    "warm": { "text": "A warm reply", "why": "Why this works", "best_when": "When to use this" },
    "direct": { "text": "A direct reply", "why": "Why this works", "best_when": "When to use this" },
    "clarifying": { "text": "A reply that asks for clarity", "why": "Why this works", "best_when": "When to use this" },
    "boundary": { "text": "A reply that sets a boundary or says no", "why": "Why this works", "best_when": "When to use this" }
  },
  "ask_directly_scripts": ["1-3 natural scripts for asking the person directly what they mean"],
  "coaching_tip": "One specific, actionable insight for this situation"
}

Provide 2-4 interpretations ordered from most to least likely.
Provide 1-6 evidence markers for key phrases.
Return ONLY valid JSON, no markdown.`;
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

    const { message, context, interaction_stage, user_need } = parsed.data;

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
          content: buildSystemPrompt(preferredCoachingStyle, context, interaction_stage, user_need),
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

    const parsedResponse = ambiguityAnalysisSchema.safeParse(parsedContent);

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

    return NextResponse.json<AmbiguityAnalysis>(parsedResponse.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
