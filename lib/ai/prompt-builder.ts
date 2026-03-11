import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type {
  Message,
  OnboardingProfile,
  Scenario,
} from "@/lib/types/database";
import { MAX_CONTEXT_MESSAGES } from "@/lib/ai/config";

// ============================================================
// System Prompt Layers
// ============================================================

function buildIdentityLayer(): string {
  return [
    "You are Cuetie, an empathetic dating communication coach designed for autistic adults.",
    "You play TWO roles simultaneously in every response:",
    "",
    "ROLE 1 — CONVERSATION PARTNER",
    "Stay fully in character as the partner persona described below.",
    "React naturally, including emotional subtext and social cues the user should learn to detect.",
    "",
    "ROLE 2 — SOCIAL CUE COACH",
    "After generating the partner's reply, provide structured coaching feedback.",
    "Break down the hidden cues in the conversation, suggest improvements, and analyse tone.",
    "Always be supportive, specific, and non-judgmental.",
  ].join("\n");
}

function buildScenarioLayer(scenario: Scenario): string {
  const { partner_persona: p } = scenario;
  return [
    "=== SCENARIO CONTEXT ===",
    `Scenario: ${scenario.title}`,
    `Description: ${scenario.description}`,
    `Category: ${scenario.category} | Difficulty: ${scenario.difficulty}`,
    `Coaching focus areas: ${scenario.coaching_focus.join(", ")}`,
    "",
    "--- Partner Persona ---",
    `Name: ${p.name} | Age: ${p.age} | Occupation: ${p.occupation}`,
    `Personality: ${p.personality_traits.join(", ")}`,
    `Backstory: ${p.backstory}`,
    `Communication style: ${p.communication_style}`,
    "",
    "--- Hidden Cues (do NOT reveal these directly) ---",
    p.hidden_cues.map((c, i) => `${i + 1}. ${c}`).join("\n"),
  ].join("\n");
}

function buildOutputFormatLayer(): string {
  return [
    "=== OUTPUT FORMAT ===",
    "You MUST respond with a single JSON object — no markdown, no extra text.",
    "Schema:",
    "{",
    '  "partner_response": "string — the in-character reply from the partner",',
    '  "coaching": {',
    '    "cue_decoded": "string — explain the social cue the user should notice",',
    '    "suggestion": "string — actionable advice for the user\'s next message",',
    '    "tone_analysis": {',
    '      "user_tone": "string — the tone the user conveyed",',
    '      "ideal_tone": "string — the tone that would work best here",',
    '      "rewrite": "string | null — optional improved version of the user\'s message"',
    "    },",
    '    "skill_tags": ["array of SkillId strings: empathy, question_quality, topic_flow, cue_detection, tone_matching, conversation_pacing, self_disclosure, active_listening"],',
    '    "skill_scores": { "skill_id": "number 0-10 (only include skills relevant to this turn)" }',
    "  }",
    "}",
  ].join("\n");
}

function buildUserProfileLayer(profile: OnboardingProfile): string {
  const lines = ["=== USER PROFILE ==="];

  if (profile.challenges?.length) {
    lines.push(`Challenges: ${profile.challenges.join(", ")}`);
  }
  if (profile.goals?.length) {
    lines.push(`Goals: ${profile.goals.join(", ")}`);
  }
  if (profile.comfort_level) {
    lines.push(`Comfort level: ${profile.comfort_level}`);
  }
  if (profile.preferred_coaching_style) {
    lines.push(`Preferred coaching style: ${profile.preferred_coaching_style}`);
    lines.push(
      profile.preferred_coaching_style === "gentle"
        ? "Use encouraging, warm language. Lead with what they did well before suggesting improvements."
        : profile.preferred_coaching_style === "direct"
          ? "Be concise and straightforward. Focus on actionable improvements."
          : "Provide detailed explanations with examples and reasoning behind each suggestion."
    );
  }

  return lines.join("\n");
}

// ============================================================
// Conversation History Formatter
// ============================================================

function formatHistory(
  messages: Message[]
): ChatCompletionMessageParam[] {
  const windowed = messages.slice(-MAX_CONTEXT_MESSAGES);

  return windowed.map((msg): ChatCompletionMessageParam => {
    if (msg.role === "user") {
      return { role: "user" as const, content: msg.content };
    }
    // Both "partner" and "system" messages map to assistant in OpenAI terms
    return { role: "assistant" as const, content: msg.content };
  });
}

// ============================================================
// Public API
// ============================================================

/**
 * Builds the full prompt array for an OpenAI chat completion call.
 *
 * @param scenario       - The active scenario with partner persona
 * @param userProfile    - The user's onboarding preferences
 * @param conversationHistory - All messages so far (will be windowed)
 * @returns Array of OpenAI chat messages ready for the API
 */
export function buildChatPrompt(
  scenario: Scenario,
  userProfile: OnboardingProfile,
  conversationHistory: Message[]
): ChatCompletionMessageParam[] {
  const systemPrompt = [
    buildIdentityLayer(),
    "",
    buildScenarioLayer(scenario),
    "",
    buildOutputFormatLayer(),
    "",
    buildUserProfileLayer(userProfile),
  ].join("\n");

  return [
    { role: "system" as const, content: systemPrompt },
    ...formatHistory(conversationHistory),
  ];
}
