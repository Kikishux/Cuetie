import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type {
  Message,
  OnboardingProfile,
  Scenario,
  Scorecard,
  SkillId,
} from "@/lib/types/database";
import { getOpenAIClient, SCORECARD_CONFIG } from "@/lib/ai/config";

// ============================================================
// Scorecard Prompt
// ============================================================

function buildScorecardPrompt(
  messages: Message[],
  scenario: Scenario,
  userProfile: OnboardingProfile
): ChatCompletionMessageParam[] {
  const transcript = messages
    .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
    .join("\n\n");

  const systemPrompt = [
    "You are Cuetie's session evaluator. You are a CRITICAL, OBJECTIVE evaluator —",
    "not a cheerleader. Analyse the full conversation transcript below",
    "and produce a detailed scorecard assessing the user's dating communication skills.",
    "",
    `Scenario: ${scenario.title} (${scenario.category}, ${scenario.difficulty})`,
    `Partner: ${scenario.partner_persona.name} — ${scenario.partner_persona.communication_style}`,
    `Coaching focus: ${scenario.coaching_focus.join(", ")}`,
    "",
    "User profile:",
    userProfile.challenges?.length
      ? `  Challenges: ${userProfile.challenges.join(", ")}`
      : "",
    userProfile.goals?.length
      ? `  Goals: ${userProfile.goals.join(", ")}`
      : "",
    userProfile.comfort_level
      ? `  Comfort level: ${userProfile.comfort_level}`
      : "",
    "",
    "=== SCORING RUBRIC (MANDATORY) ===",
    "Apply these anchors STRICTLY:",
    "  0-1: Complete failure. (Single words like 'ok', 'yeah'. Zero engagement.)",
    "  2-3: Very weak. (One short sentence, no questions, ignored partner's cues.)",
    "  4-5: Below average. (Brief with minimal substance.)",
    "  6-7: Adequate. (Real effort — asked a question OR shared personally OR acknowledged partner.)",
    "  8-9: Strong. (Multiple good behaviors — follow-up AND empathy AND topic building.)",
    "  10: Exceptional. (Extremely rare.)",
    "",
    "HARD RULES:",
    "- Single-word responses → ALL skills MUST be 0-2",
    "- Zero questions asked across the session → question_quality MUST be 0-1",
    "- Consistently under 10 words per response → conversation_pacing MUST be 0-3",
    "- Never acknowledged partner's feelings → empathy MUST be 0-2",
    "- Scores of 6+ require EVIDENCE of genuine effort (cite the specific message)",
    "- The overall_score MUST equal the weighted average of skill scores — do NOT inflate it",
    "- Do NOT inflate scores to be encouraging. Accuracy is more helpful.",
    "",
    "=== REQUIRED JSON OUTPUT ===",
    "Respond with a single JSON object matching this schema exactly:",
    "{",
    '  "overall_score": number (0-10, one decimal),',
    '  "skills": {',
    '    "<skill_id>": {',
    '      "score": number (0-10),',
    '      "trend": "new",',
    '      "feedback": "string — specific feedback citing exact user messages as evidence",',
    '      "examples": ["string — REQUIRED: quote the user\'s actual words as evidence for this score"]',
    "    }",
    "  },",
    '  "highlights": ["string — things the user genuinely did well (be specific, cite messages)"],',
    '  "growth_areas": ["string — specific areas to improve with actionable, concrete advice"],',
    '  "suggested_scenarios": ["string — scenario titles or types to try next"],',
    '  "session_duration_minutes": number,',
    '  "message_count": number',
    "}",
    "",
    "Valid skill IDs: empathy, question_quality, topic_flow, cue_detection,",
    "tone_matching, conversation_pacing, self_disclosure, active_listening.",
    "Only include skills that were exercised in this conversation.",
    "The examples field is REQUIRED — you MUST cite specific user messages as evidence for each score.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: `=== TRANSCRIPT ===\n\n${transcript}` },
  ];
}

// ============================================================
// Response Parsing
// ============================================================

function parseScorecardResponse(raw: string, messageCount: number): Scorecard {
  const parsed = JSON.parse(raw) as Scorecard;

  // Ensure required fields have sane defaults
  return {
    overall_score: Math.min(10, Math.max(0, parsed.overall_score ?? 0)),
    skills: parsed.skills ?? {},
    highlights: parsed.highlights ?? [],
    growth_areas: parsed.growth_areas ?? [],
    suggested_scenarios: parsed.suggested_scenarios ?? [],
    session_duration_minutes: parsed.session_duration_minutes ?? 0,
    message_count: parsed.message_count ?? messageCount,
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Generates a comprehensive scorecard by sending the full conversation to GPT-4o.
 *
 * @param messages    - All messages from the completed session
 * @param scenario    - The scenario that was played
 * @param userProfile - The user's onboarding profile
 * @returns A validated Scorecard object
 */
export async function generateScorecard(
  messages: Message[],
  scenario: Scenario,
  userProfile: OnboardingProfile
): Promise<Scorecard> {
  const prompt = buildScorecardPrompt(messages, scenario, userProfile);

  const completion = await getOpenAIClient().chat.completions.create({
    model: SCORECARD_CONFIG.model,
    temperature: SCORECARD_CONFIG.temperature,
    max_tokens: SCORECARD_CONFIG.max_tokens,
    response_format: SCORECARD_CONFIG.response_format,
    messages: prompt,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty scorecard response.");
  }

  try {
    return parseScorecardResponse(content, messages.length);
  } catch (err) {
    console.error("[scorecard-generator] Failed to parse scorecard:", err);
    throw new Error("Failed to parse scorecard response from OpenAI.");
  }
}

/**
 * Extracts individual skill scores from a Scorecard for DB storage.
 */
export function calculateSkillScores(
  scorecard: Scorecard
): Array<{ skill_id: SkillId; score: number }> {
  const validSkills: Set<string> = new Set<string>([
    "empathy",
    "question_quality",
    "topic_flow",
    "cue_detection",
    "tone_matching",
    "conversation_pacing",
    "self_disclosure",
    "active_listening",
  ]);

  return Object.entries(scorecard.skills)
    .filter(([key]) => validSkills.has(key))
    .map(([key, value]) => ({
      skill_id: key as SkillId,
      score: Math.min(10, Math.max(0, value.score)),
    }));
}
