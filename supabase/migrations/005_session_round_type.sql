-- Add round_type column to sessions for time-bound practice rounds
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS round_type TEXT NOT NULL DEFAULT 'standard';

-- Backfill existing sessions
UPDATE public.sessions SET round_type = 'standard' WHERE round_type IS NULL;

COMMENT ON COLUMN public.sessions.round_type IS 'Practice round type: quick (5 turns), standard (12 turns), deep (16 turns)';
