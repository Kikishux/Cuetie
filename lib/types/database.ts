// TypeScript types matching the Supabase database schema

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type ScenarioCategory =
  | "first_meeting"
  | "coffee_date"
  | "dinner_date"
  | "texting"
  | "video_call"
  | "awkward_moments"
  | "deepening_connection"
  | "conflict_resolution";

export type SessionMode = "text" | "voice";
export type SessionStatus = "active" | "completed" | "abandoned";
export type MessageRole = "user" | "partner" | "system";

export type SkillId =
  | "empathy"
  | "question_quality"
  | "topic_flow"
  | "cue_detection"
  | "tone_matching"
  | "conversation_pacing"
  | "self_disclosure"
  | "active_listening";

// ============================================================
// Table Row Types
// ============================================================

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_profile: OnboardingProfile;
  has_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProfile {
  challenges?: string[];
  goals?: string[];
  comfort_level?: "beginner" | "intermediate" | "advanced";
  preferred_coaching_style?: "gentle" | "direct" | "detailed";
}

export interface PartnerPersona {
  name: string;
  age: number;
  occupation: string;
  personality_traits: string[];
  backstory: string;
  communication_style: string;
  hidden_cues: string[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  category: ScenarioCategory;
  partner_persona: PartnerPersona;
  coaching_focus: string[];
  opening_message: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  scenario_id: string;
  mode: SessionMode;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  scorecard: Scorecard | null;
  summary: string | null;
  message_count: number;
  total_tokens: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  coaching: CoachingData | null;
  token_count: number;
  created_at: string;
}

export interface SkillDef {
  id: SkillId;
  display_name: string;
  description: string;
  category: string;
  max_score: number;
}

export interface SkillScore {
  id: string;
  user_id: string;
  session_id: string;
  skill_id: SkillId;
  score: number;
  evidence: Record<string, unknown> | null;
  measured_at: string;
}

// ============================================================
// JSONB Sub-Types
// ============================================================

export interface CoachingData {
  cue_decoded: string;
  suggestion: string;
  tone_analysis: {
    user_tone: string;
    ideal_tone: string;
    rewrite?: string;
  };
  skill_tags: SkillId[];
  skill_scores: Partial<Record<SkillId, number>>;
}

export interface Scorecard {
  overall_score: number;
  skills: Record<
    string,
    {
      score: number;
      trend: "up" | "down" | "stable" | "new";
      feedback: string;
      examples: string[];
    }
  >;
  highlights: string[];
  growth_areas: string[];
  suggested_scenarios: string[];
  session_duration_minutes: number;
  message_count: number;
}

// ============================================================
// Database helper type for Supabase client
// ============================================================

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      scenarios: { Row: Scenario; Insert: Partial<Scenario>; Update: Partial<Scenario> };
      sessions: { Row: Session; Insert: Partial<Session>; Update: Partial<Session> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      skill_defs: { Row: SkillDef; Insert: Partial<SkillDef>; Update: Partial<SkillDef> };
      skill_scores: { Row: SkillScore; Insert: Partial<SkillScore>; Update: Partial<SkillScore> };
    };
  };
}
