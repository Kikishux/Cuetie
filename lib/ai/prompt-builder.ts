import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type {
  Message,
  OnboardingProfile,
  Scenario,
  RoundType,
  SessionMode,
} from "@/lib/types/database";
import { getSessionLimits, getUserTurnCount } from "@/lib/types/database";
import type { AudioFeatures } from "@/lib/ai/voice-coaching";
import type { HumeEmotionResult } from "@/lib/types/hume";
import { MAX_CONTEXT_MESSAGES } from "@/lib/ai/config";
import { getPartnerName } from "@/lib/ai/name-pools";

// ============================================================
// System Prompt Layers
// ============================================================

function buildIdentityLayer(): string {
  return [
    "You are Cuetie, a dating communication coach designed for autistic adults.",
    "You play TWO roles simultaneously in every response:",
    "",
    "ROLE 1 — CONVERSATION PARTNER",
    "Stay fully in character as the partner persona described below.",
    "React naturally, including emotional subtext and social cues the user should learn to detect.",
    "",
    "ROLE 2 — SOCIAL CUE COACH",
    "After generating the partner's reply, provide structured coaching feedback.",
    "Break down the hidden cues in the conversation, suggest improvements, and analyse tone.",
    "",
    "=== COACHING TONE vs SCORING ACCURACY ===",
    "Your COACHING LANGUAGE should be supportive, specific, and constructive.",
    "Your SCORES must be STRICTLY OBJECTIVE and evidence-based.",
    "A warm coaching message about a weak response must still produce a LOW score.",
    "Do NOT inflate scores to be encouraging — accurate feedback is more helpful than false positivity.",
    "",
    "=== ANTI-REPETITION RULES ===",
    "CRITICAL: NEVER repeat a topic, question pattern, or conversation structure already used.",
    "Do NOT ask 'Do you have a favorite X?' more than once — if you already asked about favorites, try a completely different question type.",
    "Track all topics covered internally. If conversation stalls, introduce something COMPLETELY NEW and unrelated.",
    "If the user gives short or dismissive answers, do NOT keep trying the same approach.",
    "Instead, pivot: share something personal, make an observation, or try humor.",
    "Vary your sentence structure, question types, and topic across every turn.",
  ].join("\n");
}

function buildScenarioLayer(scenario: Scenario, partnerNameOverride?: string | null): string {
  const { partner_persona: p } = scenario;
  const name = partnerNameOverride || p.name;
  const lines = [
    "=== SCENARIO CONTEXT ===",
    `Scenario: ${scenario.title}`,
    `Description: ${scenario.description}`,
    `Category: ${scenario.category} | Difficulty: ${scenario.difficulty}`,
    `Coaching focus areas: ${scenario.coaching_focus.join(", ")}`,
    "",
    "--- Partner Persona ---",
    `Name: ${name} | Age: ${p.age} | Occupation: ${p.occupation}`,
    `Personality: ${p.personality_traits.join(", ")}`,
    `Backstory: ${p.backstory}`,
    `Communication style: ${p.communication_style}`,
    "",
    "--- Hidden Cues (do NOT reveal these directly) ---",
    p.hidden_cues.map((c, i) => `${i + 1}. ${c}`).join("\n"),
  ];

  const dimensions: string[] = [];
  if (p.attachment_style) dimensions.push(`Attachment style: ${p.attachment_style}`);
  if (p.communication_pattern) dimensions.push(`Communication pattern: ${p.communication_pattern}`);
  if (p.flirtiness) dimensions.push(`Flirtiness level: ${p.flirtiness}`);
  if (p.emotional_availability) dimensions.push(`Emotional availability: ${p.emotional_availability}`);
  if (p.conflict_style) dimensions.push(`Conflict style: ${p.conflict_style}`);
  if (p.texting_style) dimensions.push(`Texting style: ${p.texting_style}`);

  if (dimensions.length > 0) {
    lines.push("");
    lines.push("--- Partner Behavioral Dimensions ---");
    lines.push(...dimensions);
    lines.push("");
    lines.push("IMPORTANT: Stay consistent with these behavioral dimensions throughout the conversation.");
    lines.push("When providing coaching, explain social cues in terms of these dimensions.");
    lines.push("Example: 'They changed the subject — this fits their avoidant conflict style.'");
  }

  return lines.join("\n");
}

function buildOutputFormatLayer(hasAudioFeatures: boolean): string {
  const schema = [
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
    '    "micro_cue": "string | null — a brief inline coaching nudge for the user (see MICRO-CUE RULES below)"',
  ];

  if (hasAudioFeatures) {
    schema.push(
      '    ,"voice_tone": {',
      '      "detected_emotion": "string — the primary emotion you detect from the voice data: nervous, confident, warm, flat, excited, anxious, friendly, hesitant, enthusiastic",',
      '      "confidence_level": "number 1-10 — how confident the user sounds based on pitch stability, energy, and word choice",',
      '      "expressiveness": "number 1-10 — 1=very monotone, 10=very expressive, based on pitch and energy variability",',
      '      "energy_match": "string — whether vocal energy matches the conversation context (e.g. too quiet for an enthusiastic topic)",',
      '      "suggestion": "string — one specific, actionable vocal delivery tip"',
      "    }",
    );
  }

  schema.push("  }", "}");
  schema.push("");
  schema.push("=== MICRO-CUE RULES ===");
  schema.push("Set micro_cue to a brief coaching nudge (max 8 words) based on the user's LATEST message ONLY:");
  schema.push('  - If user asked no question: "💬 Try asking a follow-up question"');
  schema.push('  - If user asked a great question: "✨ Great question!"');
  schema.push('  - If the partner\'s MOST RECENT message (not earlier turns) embedded a cue: "🔍 They mentioned [topic] — explore that"');
  schema.push('  - If user response was very short: "📝 Try sharing a bit more"');
  schema.push('  - If user showed genuine empathy: "❤️ Nice empathetic response"');
  schema.push("  - Set to null if no specific nudge is needed");
  schema.push("  IMPORTANT: Only reference cues/topics from the partner's MOST RECENT message. Never repeat cues from earlier turns.");

  return schema.join("\n");
}

function buildVoiceContextLayer(features: AudioFeatures): string {
  const pitchDesc =
    features.avgPitch < 130 ? "low" : features.avgPitch < 200 ? "moderate" : "high";
  const variabilityDesc =
    features.pitchVariability < 15 ? "very monotone" :
    features.pitchVariability < 30 ? "somewhat monotone" :
    features.pitchVariability < 50 ? "moderately expressive" : "very expressive";
  const energyDesc =
    features.avgEnergy < 0.03 ? "very quiet" :
    features.avgEnergy < 0.08 ? "soft" :
    features.avgEnergy < 0.15 ? "moderate volume" : "loud and clear";
  const pauseDesc =
    features.pauseRatio > 0.5 ? "many pauses (hesitant)" :
    features.pauseRatio > 0.3 ? "some pauses" : "few pauses (flowing speech)";

  return [
    "=== VOICE ANALYSIS (from audio features) ===",
    `Pitch: ${pitchDesc} register (${features.avgPitch}Hz avg), ${variabilityDesc} (variability: ${features.pitchVariability})`,
    `Energy: ${energyDesc} (${features.avgEnergy} RMS), energy variability: ${features.energyVariability}`,
    `Delivery: ${pauseDesc} (pause ratio: ${Math.round(features.pauseRatio * 100)}%)`,
    `Speaking duration: ${features.speakingDuration}s`,
    "",
    "Use these voice characteristics to assess the user's vocal confidence, warmth, and expressiveness.",
    "Provide coaching on vocal delivery in the voice_tone field of your response.",
  ].join("\n");
}

function buildHumeEmotionLayer(humeEmotions: HumeEmotionResult): string {
  const dominantScore = humeEmotions.topEmotions[0]?.score ?? 0;
  const topEmotions = humeEmotions.topEmotions
    .slice(0, 3)
    .map((emotion) => `${emotion.name}: ${Math.round(emotion.score * 100)}%`)
    .join(", ");

  return [
    "=== EMOTION ANALYSIS (from vocal prosody) ===",
    `The user's voice expresses: ${humeEmotions.dominantEmotion} (${Math.round(dominantScore * 100)}%)`,
    `Top emotions detected: ${topEmotions}`,
    `Overall emotional tone: ${humeEmotions.emotionValence}`,
    "",
    "Use this emotional context to provide more empathetic and specific coaching.",
    "If the user sounds anxious, acknowledge it gently. If they sound confident, reinforce it.",
  ].join("\n");
}

function buildUserProfileLayer(profile: OnboardingProfile): string {
  const lines = ["=== USER PROFILE ==="];

  if (profile.gender) {
    const genderLabel =
      profile.gender === "other" && profile.gender_custom
        ? profile.gender_custom
        : profile.gender;
    lines.push(`Gender identity: ${genderLabel}`);
  }
  if (profile.dating_preference) {
    lines.push(`Dating preference: ${profile.dating_preference}`);
  }
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
        ? "Use encouraging language in coaching text. But keep scores strictly objective — do not inflate scores to match the warm tone."
        : profile.preferred_coaching_style === "direct"
          ? "Be concise and straightforward. Focus on actionable improvements. Scores should reflect actual performance."
          : "Provide detailed explanations with examples and reasoning. Scores should be evidence-based."
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
 * @param audioFeatures  - Optional audio features from voice recording
 * @returns Array of OpenAI chat messages ready for the API
 */
function buildSessionPacingLayer(
  roundType: RoundType,
  mode: SessionMode,
  messageCount: number,
): string {
  const limits = getSessionLimits(roundType, mode);
  const currentTurn = getUserTurnCount(messageCount);
  const totalTurns = limits.max_user_turns;
  const remaining = Math.max(0, totalTurns - currentTurn);

  const lines = [
    "=== SESSION PACING ===",
    `This is a ${roundType} practice round with ${totalTurns} user turns total.`,
    `Current turn: ${currentTurn + 1} of ${totalTurns} (${remaining} remaining after this one).`,
  ];

  if (remaining <= 2 && remaining > 0) {
    lines.push(
      "",
      "IMPORTANT: The conversation is nearing its end.",
      "As the partner, begin naturally wrapping up — perhaps suggest exchanging numbers,",
      "making plans, or giving a warm goodbye. Do NOT abruptly end the conversation.",
      "Let the user practice closing a conversation gracefully.",
    );
  } else if (remaining <= Math.ceil(totalTurns / 2)) {
    lines.push(
      "",
      "The conversation is past the midpoint. Begin deepening the connection or",
      "moving toward a natural next step (suggesting plans, sharing something personal).",
    );
  } else {
    lines.push(
      "",
      "The conversation is still early. Focus on building rapport, asking questions,",
      "and showing genuine interest. Don't rush toward big milestones.",
    );
  }

  return lines.join("\n");
}

export function buildChatPrompt(
  scenario: Scenario,
  userProfile: OnboardingProfile,
  conversationHistory: Message[],
  audioFeatures?: AudioFeatures | null,
  humeEmotions?: HumeEmotionResult | null,
  sessionPacing?: { roundType: RoundType; mode: SessionMode; messageCount: number },
): ChatCompletionMessageParam[] {
  const partnerNameOverride = getPartnerName(
    userProfile.dating_preference,
    scenario.sort_order
  );

  const layers = [
    buildIdentityLayer(),
    "",
    buildScenarioLayer(scenario, partnerNameOverride),
    "",
    buildOutputFormatLayer(!!audioFeatures),
    "",
    buildUserProfileLayer(userProfile),
  ];

  if (audioFeatures) {
    layers.push("", buildVoiceContextLayer(audioFeatures));
  }

  if (humeEmotions) {
    layers.push("", buildHumeEmotionLayer(humeEmotions));
  }

  if (sessionPacing) {
    layers.push("", buildSessionPacingLayer(
      sessionPacing.roundType,
      sessionPacing.mode,
      sessionPacing.messageCount,
    ));
  }

  const systemPrompt = layers.join("\n");

  return [
    { role: "system" as const, content: systemPrompt },
    ...formatHistory(conversationHistory),
  ];
}
