import type {
  CoachingData,
  Message,
  OnboardingProfile,
  Scenario,
  Scorecard,
  SkillId,
} from "@/lib/types/database";

// ============================================================
// AI Response Types
// ============================================================

/** Structured JSON returned by GPT-4o for every chat turn. */
export interface AIResponse {
  partner_response: string;
  coaching: CoachingData;
}

// ============================================================
// Prompt Configuration
// ============================================================

export interface PromptConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  response_format: { type: "json_object" | "text" };
}

// ============================================================
// Scorecard Request / Response
// ============================================================

export interface ScorecardRequest {
  messages: Message[];
  scenario: Scenario;
  userProfile: OnboardingProfile;
  sessionStartedAt: string;
}

export interface ScorecardResponse {
  scorecard: Scorecard;
  skillScores: Array<{ skill_id: SkillId; score: number }>;
}
