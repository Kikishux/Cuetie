-- Add Fine-Tune Skills tracking to sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS is_finetune BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS source_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.sessions.is_finetune IS 'True if this session was generated as a Fine-Tune Skills practice from a scorecard recommendation';
COMMENT ON COLUMN public.sessions.source_session_id IS 'The session whose scorecard generated the Fine-Tune recommendation';
