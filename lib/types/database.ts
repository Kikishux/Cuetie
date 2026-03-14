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
  subscription_tier: "free" | "premium";
  created_at: string;
  updated_at: string;
}

export type GenderIdentity =
  | "male"
  | "female"
  | "non-binary"
  | "genderqueer"
  | "prefer-not-to-say"
  | "other";

export type DatingPreference =
  | "male"
  | "female"
  | "non-binary"
  | "genderqueer"
  | "no-preference";

export type SensoryMode = "everyday" | "soft-focus" | "clear-view" | "quiet-session";
export type MotionPreference = "system" | "reduced" | "full";
export type ContrastPreference = "system" | "soft" | "strong";
export type AudioPreference = "muted" | "on";
export type CoachingDensity = "full" | "condensed";

export interface SensoryPreferences {
  mode: SensoryMode;
  motion: MotionPreference;
  contrast: ContrastPreference;
  audio: AudioPreference;
  voice_autoplay: boolean;
  coaching_density: CoachingDensity;
}

export const DEFAULT_SENSORY_PREFERENCES: SensoryPreferences = {
  mode: "everyday",
  motion: "system",
  contrast: "system",
  audio: "on",
  voice_autoplay: false,
  coaching_density: "full",
};

export interface OnboardingProfile {
  gender?: GenderIdentity;
  gender_custom?: string;
  dating_preference?: DatingPreference;
  challenges?: string[];
  goals?: string[];
  comfort_level?: "beginner" | "intermediate" | "advanced";
  preferred_coaching_style?: "gentle" | "direct" | "detailed";
  sensory_preferences?: SensoryPreferences;
}

export interface PartnerPersona {
  name: string;
  age: number;
  occupation: string;
  personality_traits: string[];
  backstory: string;
  communication_style: string;
  hidden_cues: string[];
  attachment_style?: "secure" | "anxious" | "avoidant" | "fearful-avoidant";
  communication_pattern?: "verbose" | "concise" | "emoji-heavy" | "formal" | "casual";
  flirtiness?: "shy" | "subtle" | "moderate" | "bold";
  emotional_availability?: "open" | "guarded" | "walls-up";
  conflict_style?: "avoids" | "addresses-gently" | "confrontational" | "passive-aggressive";
  texting_style?: "instant-replier" | "slow-texter" | "double-texter" | "brief";
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
  voice_tone?: {
    detected_emotion: string;
    confidence_level: number;
    expressiveness: number;
    energy_match: string;
    suggestion: string;
  };
  hume_emotions?: {
    topEmotions: { name: string; score: number }[];
    dominantEmotion: string;
    emotionValence: "positive" | "negative" | "neutral";
  };
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
      users: {
        Row: Omit<User, "subscription_tier"> & { subscription_tier: string };
        Insert: Partial<User> & { subscription_tier?: string };
        Update: Partial<User> & { subscription_tier?: string };
      };
      scenarios: { Row: Scenario; Insert: Partial<Scenario>; Update: Partial<Scenario> };
      sessions: { Row: Session; Insert: Partial<Session>; Update: Partial<Session> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      skill_defs: { Row: SkillDef; Insert: Partial<SkillDef>; Update: Partial<SkillDef> };
      skill_scores: { Row: SkillScore; Insert: Partial<SkillScore>; Update: Partial<SkillScore> };
    };
  };
}
