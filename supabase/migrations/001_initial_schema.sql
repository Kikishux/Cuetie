-- Cuetie MVP Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE scenario_category AS ENUM (
    'first_meeting', 'coffee_date', 'dinner_date',
    'texting', 'video_call', 'awkward_moments',
    'deepening_connection', 'conflict_resolution'
);
CREATE TYPE session_mode AS ENUM ('text', 'voice');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE message_role AS ENUM ('user', 'partner', 'system');

-- ============================================================
-- USERS (public profile linked to auth.users)
-- ============================================================

CREATE TABLE public.users (
    id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email              TEXT NOT NULL,
    display_name       TEXT,
    avatar_url         TEXT,
    onboarding_profile JSONB DEFAULT '{}'::jsonb,
    has_onboarded      BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create public user on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SCENARIOS
-- ============================================================

CREATE TABLE public.scenarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    difficulty      difficulty_level NOT NULL DEFAULT 'beginner',
    category        scenario_category NOT NULL,
    partner_persona JSONB NOT NULL,
    coaching_focus  TEXT[] NOT NULL DEFAULT '{}',
    opening_message TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE public.sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scenario_id     UUID NOT NULL REFERENCES public.scenarios(id),
    mode            session_mode NOT NULL DEFAULT 'text',
    status          session_status NOT NULL DEFAULT 'active',
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    scorecard       JSONB,
    summary         TEXT,
    message_count   INTEGER DEFAULT 0,
    total_tokens    INTEGER DEFAULT 0
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE public.messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    role            message_role NOT NULL,
    content         TEXT NOT NULL,
    coaching        JSONB,
    token_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILL DEFINITIONS
-- ============================================================

CREATE TABLE public.skill_defs (
    id              TEXT PRIMARY KEY,
    display_name    TEXT NOT NULL,
    description     TEXT NOT NULL,
    category        TEXT NOT NULL,
    max_score       DECIMAL DEFAULT 10.0
);

INSERT INTO public.skill_defs (id, display_name, description, category) VALUES
    ('empathy', 'Empathy & Validation', 'Ability to acknowledge and validate the other person''s feelings and experiences', 'emotional'),
    ('question_quality', 'Question Quality', 'Asking thoughtful, open-ended questions that show genuine interest', 'conversational'),
    ('topic_flow', 'Topic Flow', 'Natural transitions between topics without abrupt changes', 'conversational'),
    ('cue_detection', 'Social Cue Detection', 'Recognizing subtle social signals like discomfort, interest, or sarcasm', 'social'),
    ('tone_matching', 'Tone Matching', 'Adjusting communication tone to match the context and mood', 'emotional'),
    ('conversation_pacing', 'Conversation Pacing', 'Balanced turn-taking without dominating or going silent', 'conversational'),
    ('self_disclosure', 'Self-Disclosure Balance', 'Sharing personal information at an appropriate depth and pace', 'social'),
    ('active_listening', 'Active Listening', 'Demonstrating attentiveness by referencing what the other person said', 'emotional');

-- ============================================================
-- SKILL SCORES (Progress Tracking)
-- ============================================================

CREATE TABLE public.skill_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    skill_id        TEXT NOT NULL REFERENCES public.skill_defs(id),
    score           DECIMAL NOT NULL CHECK (score >= 0 AND score <= 10),
    evidence        JSONB,
    measured_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, skill_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_skill_scores_user_id ON public.skill_scores(user_id);
CREATE INDEX idx_skill_scores_skill_id ON public.skill_scores(skill_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own sessions" ON public.sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON public.messages FOR ALL
    USING (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own scores" ON public.skill_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Scenarios viewable by authenticated" ON public.scenarios FOR SELECT USING (auth.role() = 'authenticated');
