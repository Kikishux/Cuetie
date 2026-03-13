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
}

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
