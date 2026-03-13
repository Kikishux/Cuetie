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
