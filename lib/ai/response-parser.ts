import { z } from "zod/v4";
import type { AIResponse } from "@/lib/types/ai";
import type { CoachingData, SkillId } from "@/lib/types/database";

// ============================================================
// Zod Schemas
// ============================================================

const VALID_SKILL_IDS: [SkillId, ...SkillId[]] = [
  "empathy",
  "question_quality",
  "topic_flow",
  "cue_detection",
  "tone_matching",
  "conversation_pacing",
  "self_disclosure",
  "active_listening",
];

const skillIdSchema = z.enum(VALID_SKILL_IDS);

const toneAnalysisSchema = z.object({
  user_tone: z.string(),
  ideal_tone: z.string(),
  rewrite: z.string().nullish(),
});

const coachingDataSchema = z.object({
  cue_decoded: z.string(),
  suggestion: z.string(),
  tone_analysis: toneAnalysisSchema,
  skill_tags: z.array(skillIdSchema),
  skill_scores: z.record(z.string(), z.number().min(0).max(10)).default({}),
});

export const aiResponseSchema = z.object({
  partner_response: z.string().min(1),
  coaching: coachingDataSchema,
});

// ============================================================
// Fallback Builder
// ============================================================

function buildFallbackResponse(rawContent: string): AIResponse {
  console.warn(
    "[response-parser] Using fallback — raw content could not be parsed."
  );
  return {
    partner_response: rawContent || "I'm not sure what to say right now.",
    coaching: {
      cue_decoded: "Unable to analyse this turn.",
      suggestion: "Try asking an open-ended question to keep the conversation going.",
      tone_analysis: {
        user_tone: "unknown",
        ideal_tone: "warm and curious",
      },
      skill_tags: [],
      skill_scores: {},
    },
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Parses the raw string content from GPT-4o into a validated AIResponse.
 * Falls back gracefully if the JSON is malformed or fails validation.
 */
export function parseAIResponse(rawContent: string): AIResponse {
  try {
    const json: unknown = JSON.parse(rawContent);
    const result = aiResponseSchema.safeParse(json);

    if (result.success) {
      return result.data as AIResponse;
    }

    console.error(
      "[response-parser] Validation failed:",
      result.error.issues
    );
    // If we at least got a partner_response string, use it
    if (
      typeof json === "object" &&
      json !== null &&
      "partner_response" in json &&
      typeof (json as Record<string, unknown>).partner_response === "string"
    ) {
      return buildFallbackResponse(
        (json as Record<string, unknown>).partner_response as string
      );
    }

    return buildFallbackResponse(rawContent);
  } catch {
    console.error(
      "[response-parser] JSON.parse failed for content:",
      rawContent.slice(0, 200)
    );
    return buildFallbackResponse(rawContent);
  }
}

/**
 * Extracts the coaching portion from a parsed AI response.
 */
export function extractCoachingData(response: AIResponse): CoachingData {
  return response.coaching;
}
