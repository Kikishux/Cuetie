import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import type { GeneratedScenario } from "@/lib/types/database";

const generateSchema = z.object({
  title: z.string().min(1).max(200),
  skill_focus: z.array(z.string()).min(1).max(3),
  context: z.string().max(500).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
});

const SCENARIO_CATEGORIES = [
  "first_meeting", "coffee_date", "dinner_date", "texting",
  "video_call", "awkward_moments", "deepening_connection", "conflict_resolution",
];

const PARTNER_ARCHETYPES = [
  { style: "warm and curious", traits: ["warm", "curious", "patient"] },
  { style: "direct and busy", traits: ["direct", "efficient", "friendly"] },
  { style: "playful and expressive", traits: ["playful", "expressive", "energetic"] },
  { style: "thoughtful and reserved", traits: ["thoughtful", "reserved", "genuine"] },
  { style: "easygoing and humorous", traits: ["easygoing", "funny", "relaxed"] },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { title, skill_focus, context, difficulty } = parsed.data;

    const archetype = PARTNER_ARCHETYPES[Math.floor(Math.random() * PARTNER_ARCHETYPES.length)];

    const prompt = `Generate a dating practice micro-scenario for an autistic adult communication coach app.

SKILL FOCUS: ${skill_focus.join(", ")}
TOPIC: ${title}
DIFFICULTY: ${difficulty}
${context ? `CONTEXT: ${context}` : ""}

PARTNER ARCHETYPE: ${archetype.style} (traits: ${archetype.traits.join(", ")})

Generate a JSON object with EXACTLY this structure:
{
  "title": "${title}",
  "description": "1-2 sentences describing the practice scenario",
  "difficulty": "${difficulty}",
  "category": "one of: ${SCENARIO_CATEGORIES.join(", ")}",
  "partner_persona": {
    "name": "a realistic first name",
    "age": number between 24-35,
    "occupation": "a realistic occupation",
    "personality_traits": ${JSON.stringify(archetype.traits)},
    "backstory": "1 sentence about this person",
    "communication_style": "1 sentence about how they communicate",
    "hidden_cues": ["2-3 simple social cues the user should learn to detect"]
  },
  "coaching_focus": ${JSON.stringify(skill_focus)},
  "opening_message": "The partner's first message to start the conversation (friendly, natural, includes a question or hook)",
  "success_target": "1 sentence describing what success looks like for the user in this practice"
}

RULES:
- Keep the scenario focused on the skill(s): ${skill_focus.join(", ")}
- The opening message should naturally invite the user to practice the target skill
- Hidden cues should be simple and detectable (2-3 max)
- This is a Quick Round (5 turns) so keep scope narrow
- Return ONLY valid JSON`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Generate a micro-scenario for: ${title}` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "BAD_GATEWAY", message: "Failed to generate scenario" } },
        { status: 502 }
      );
    }

    const scenario = JSON.parse(content) as GeneratedScenario;

    return NextResponse.json<GeneratedScenario>(scenario);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
