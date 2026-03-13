import type {
  Message,
  Scenario,
  Scorecard,
  Session,
  SkillId,
} from "@/lib/types/database";

// ============================================================
// API Request Types
// ============================================================

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface StartSessionRequest {
  scenarioId: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface StartSessionResponse {
  session: Session;
  scenario: Scenario;
  openingMessage: Message;
}

export interface EndSessionResponse {
  scorecard: Scorecard;
  session: Session;
}

export interface WeakSkillSummary {
  id: SkillId;
  score: number;
  label: string;
}

export interface RecommendedScenariosResponse {
  recommended: Scenario[];
  weakSkills: WeakSkillSummary[];
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
