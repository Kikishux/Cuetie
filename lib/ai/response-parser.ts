import { z } from "zod/v4";
import type { AIResponse } from "@/lib/types/ai";
import type { CoachingData, SkillId } from "@/lib/types/database";

// ============================================================
// Zod Schemas — lenient to avoid dropping valid coaching data
// ============================================================

const toneAnalysisSchema = z.object({
  user_tone: z.string(),
  ideal_tone: z.string(),
  rewrite: z.string().nullish(),
});

const voiceToneSchema = z.object({
  detected_emotion: z.string(),
  confidence_level: z.number().min(0).max(10),
  expressiveness: z.number().min(0).max(10),
  energy_match: z.string(),
  suggestion: z.string(),
}).optional();

const coachingDataSchema = z.object({
  cue_decoded: z.string(),
  suggestion: z.string(),
  tone_analysis: toneAnalysisSchema,
  skill_tags: z.array(z.string()).default([]),
  skill_scores: z.record(z.string(), z.number()).optional().default({}),
  micro_cue: z.string().nullish(),
  voice_tone: voiceToneSchema,
});

export const aiResponseSchema = z.object({
  micro_cue: z.string().nullish(),
  partner_response: z.string().min(1),
  coaching: coachingDataSchema,
});

// ============================================================
// Smart Fallback — extract whatever coaching the AI DID return
// ============================================================

function extractPartialCoaching(json: unknown): Partial<CoachingData> {
  if (typeof json !== "object" || json === null) return {};
  const obj = json as Record<string, unknown>;
  const coaching = (obj.coaching ?? obj) as Record<string, unknown>;

  const result: Partial<CoachingData> = {};
  if (typeof coaching.cue_decoded === "string") result.cue_decoded = coaching.cue_decoded;
  if (typeof coaching.suggestion === "string") result.suggestion = coaching.suggestion;
  // micro_cue may be at top level (new schema) or inside coaching (legacy)
  if (typeof obj.micro_cue === "string") result.micro_cue = obj.micro_cue;
  else if (typeof coaching.micro_cue === "string") result.micro_cue = coaching.micro_cue;
  if (coaching.tone_analysis && typeof coaching.tone_analysis === "object") {
    const ta = coaching.tone_analysis as Record<string, unknown>;
    result.tone_analysis = {
      user_tone: typeof ta.user_tone === "string" ? ta.user_tone : "conversational",
      ideal_tone: typeof ta.ideal_tone === "string" ? ta.ideal_tone : "warm and curious",
      rewrite: typeof ta.rewrite === "string" ? ta.rewrite : undefined,
    };
  }
  if (Array.isArray(coaching.skill_tags)) {
    result.skill_tags = coaching.skill_tags.filter((t): t is SkillId => typeof t === "string") as SkillId[];
  }
  return result;
}

function buildFallbackResponse(rawContent: string, originalJson?: unknown): AIResponse {
  console.warn("[response-parser] Using fallback — extracting partial coaching data.");

  const partial = originalJson ? extractPartialCoaching(originalJson) : {};

  return {
    partner_response: rawContent || "I'm not sure what to say right now.",
    coaching: {
      cue_decoded: partial.cue_decoded || "Notice how the partner responded — what signals do you see?",
      suggestion: partial.suggestion || "Try responding with a question or sharing something about yourself.",
      tone_analysis: partial.tone_analysis || {
        user_tone: "conversational",
        ideal_tone: "warm and curious",
      },
      skill_tags: partial.skill_tags || [],
      skill_scores: {},
      micro_cue: partial.micro_cue || null,
    },
  };
}

// ============================================================
// Public API
// ============================================================

export function parseAIResponse(rawContent: string): AIResponse {
  try {
    const json: unknown = JSON.parse(rawContent);
    const result = aiResponseSchema.safeParse(json);

    if (result.success) {
      const data = result.data;
      // Merge top-level micro_cue into coaching (schema moved it outside coaching to force earlier generation)
      if (data.micro_cue && !data.coaching.micro_cue) {
        data.coaching.micro_cue = data.micro_cue;
      }
      return data as AIResponse;
    }

    console.warn(
      "[response-parser] Validation issues (using partial extraction):",
      result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
    );

    // Extract partner_response and whatever coaching data IS valid
    const obj = json as Record<string, unknown>;
    const partnerResponse = typeof obj.partner_response === "string"
      ? obj.partner_response
      : rawContent;

    return buildFallbackResponse(partnerResponse, json);
  } catch {
    console.error("[response-parser] JSON.parse failed for content:", rawContent.slice(0, 200));
    return buildFallbackResponse(rawContent);
  }
}

export function extractCoachingData(response: AIResponse): CoachingData {
  return response.coaching;
}
