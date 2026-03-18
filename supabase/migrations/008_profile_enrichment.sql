ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_enrichment JSONB NOT NULL DEFAULT '{}';
