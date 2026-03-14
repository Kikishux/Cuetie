export interface SuggestedReply {
  tone: string;
  text: string;
  why: string;
}

export interface CoachFlags {
  green: string[];
  yellow: string[];
  red: string[];
}

export interface CoachAnalysisRequest {
  message: string;
  context?: string;
  interaction_stage?: InteractionStage;
  user_need?: UserNeed;
}

export type InteractionStage =
  | "just-matched"
  | "early-texting"
  | "after-first-date"
  | "ongoing-dating"
  | "other";

export type UserNeed =
  | "understand-meaning"
  | "decide-whether-to-reply"
  | "write-a-reply"
  | "check-if-should-ask-directly";

export type AmbiguityLevel = "low" | "medium" | "high";
export type SupportLevel = "strong" | "some" | "weak";

export interface Interpretation {
  label: string;
  support_level: SupportLevel;
  explanation: string;
  evidence_phrases: string[];
}

export interface EvidenceMarker {
  phrase: string;
  could_mean: string;
  but_also: string;
}

export interface GoalResponse {
  text: string;
  why: string;
  best_when: string;
}

export interface AmbiguityAnalysis {
  best_read: string;
  ambiguity_level: AmbiguityLevel;
  best_next_move: string;
  literal_meaning: string;
  interpretations: Interpretation[];
  evidence_markers: EvidenceMarker[];
  responses_by_goal: {
    warm: GoalResponse;
    direct: GoalResponse;
    clarifying: GoalResponse;
    boundary: GoalResponse;
  };
  ask_directly_scripts: string[];
  coaching_tip: string;
}

/** @deprecated Use AmbiguityAnalysis instead */
export interface CoachAnalysisResponse {
  decoded_meaning: string;
  social_cues: string[];
  tone: string;
  flags: CoachFlags;
  suggested_replies: SuggestedReply[];
  coaching_tip: string;
}

export interface DebriefRequest {
  what_happened: string;
  how_did_you_feel?: string;
  specific_moment?: string;
  what_was_hard?: string;
}

export interface ChallengingMoment {
  moment: string;
  decoded: string;
  tip: string;
}

export interface ScenarioSuggestion {
  title: string;
  why: string;
}

export interface DebriefResponse {
  summary: string;
  went_well: string[];
  challenging_moments: ChallengingMoment[];
  patterns_noticed: string[];
  suggested_scenarios: ScenarioSuggestion[];
  overall_encouragement: string;
}
