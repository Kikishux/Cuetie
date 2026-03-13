import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CHAT_CONFIG, getOpenAIClient } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type { DebriefRequest, DebriefResponse } from "@/lib/types/coach";
import type { OnboardingProfile } from "@/lib/types/database";

const debriefRequestSchema: z.ZodType<DebriefRequest> = z.object({
  what_happened: z.string().trim().min(1, "What happened is required").max(5000),
  how_did_you_feel: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(2000).optional()
  ),
  specific_moment: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(2000).optional()
  ),
  what_was_hard: z.preprocess(
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

function buildSystemPrompt(
  preferredCoachingStyle: NonNullable<
    OnboardingProfile["preferred_coaching_style"]
  >,
  scenarios: Array<{ title: string; description: string }>,
  details: Omit<DebriefRequest, "what_happened">
) {
  const scenarioList = scenarios
    .map((scenario) => `- "${scenario.title}": ${scenario.description}`)
    .join("\n");

  const optionalContext = [
    details.how_did_you_feel
      ? `How they felt during and after: ${details.how_did_you_feel}`
      : null,
    details.specific_moment
      ? `Specific moment that felt tricky: ${details.specific_moment}`
      : null,
    details.what_was_hard
      ? `What felt hardest: ${details.what_was_hard}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are Cuetie, a dating communication coach for autistic adults.
The user just went on a real date and wants to debrief what happened.
Your coaching style is: ${preferredCoachingStyle}

Available Cuetie practice scenarios they could try next:
${scenarioList}

${optionalContext ? `${optionalContext}

` : ""}Analyze their debrief and return a JSON object with EXACTLY this structure:
{
  "summary": "1-2 sentence recap of how the date went overall",
  "went_well": ["2-4 specific things the user did well, based on what they described"],
  "challenging_moments": [
    { "moment": "What happened", "decoded": "What was really going on socially — explain concretely", "tip": "What to try differently next time" }
  ],
  "patterns_noticed": ["Any recurring patterns or themes worth being aware of"],
  "suggested_scenarios": [
    { "title": "EXACT scenario title from the available list above", "why": "Why practicing this would help based on their debrief" }
  ],
  "overall_encouragement": "Warm, genuine closing message acknowledging their effort"
}

CRITICAL: suggested_scenarios must use EXACT titles from the available scenarios list.
Suggest 2-4 scenarios that directly address what was challenging.
Be concrete and specific — autistic users benefit from clear, explicit analysis.
Return ONLY valid JSON.`;
}

function createDebriefResponseSchema(validScenarioTitles: string[]) {
  const allowedTitles = new Set(validScenarioTitles);

  return z.object({
    summary: z.string().min(1),
    went_well: z.array(z.string().min(1)).min(2).max(4),
    challenging_moments: z
      .array(
        z.object({
          moment: z.string().min(1),
          decoded: z.string().min(1),
          tip: z.string().min(1),
        })
      )
      .min(1)
      .max(4),
    patterns_noticed: z.array(z.string().min(1)).max(4),
    suggested_scenarios: z
      .array(
        z.object({
          title: z
            .string()
            .min(1)
            .refine((title) => allowedTitles.has(title), {
              message: "Scenario title must match an available scenario",
            }),
          why: z.string().min(1),
        })
      )
      .min(2)
      .max(4),
    overall_encouragement: z.string().min(1),
  });
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

    const parsed = debriefRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { what_happened, how_did_you_feel, specific_moment, what_was_hard } =
      parsed.data;

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

    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("title, description, coaching_focus")
      .eq("is_active", true);

    if (scenariosError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Unable to load practice scenarios for debrief coaching",
          },
        },
        { status: 500 }
      );
    }

    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "No active practice scenarios are available right now",
          },
        },
        { status: 500 }
      );
    }

    const completion = await getOpenAIClient().chat.completions.create({
      model: CHAT_CONFIG.model,
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.max_tokens,
      response_format: CHAT_CONFIG.response_format,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(preferredCoachingStyle, scenarios, {
            how_did_you_feel,
            specific_moment,
            what_was_hard,
          }),
        },
        {
          role: "user",
          content: what_happened,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "OpenAI returned an empty debrief response",
          },
        },
        { status: 502 }
      );
    }

    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("[coach/debrief] Failed to parse OpenAI JSON response:", {
        error,
        content,
      });

      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "Failed to parse debrief response from OpenAI",
          },
        },
        { status: 502 }
      );
    }

    const debriefResponseSchema = createDebriefResponseSchema(
      scenarios.map((scenario) => scenario.title)
    );
    const parsedResponse = debriefResponseSchema.safeParse(parsedContent);

    if (!parsedResponse.success) {
      console.error(
        "[coach/debrief] OpenAI response failed validation:",
        parsedResponse.error.issues
      );

      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "BAD_GATEWAY",
            message: "OpenAI returned an invalid debrief response",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json<DebriefResponse>(parsedResponse.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
