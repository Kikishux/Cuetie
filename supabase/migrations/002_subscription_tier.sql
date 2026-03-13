-- Add subscription tier to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

UPDATE public.users
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

ALTER TABLE public.users
ALTER COLUMN subscription_tier SET DEFAULT 'free',
ALTER COLUMN subscription_tier SET NOT NULL;

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_subscription_tier_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'premium'));
  END IF;
END
$$;

-- RLS: users can read their own tier but not update it (admin only via service role)
-- The existing RLS policies on users table should already handle row-level access.
-- Add a specific policy to prevent users from updating their own tier:
DROP POLICY IF EXISTS "Users cannot update subscription_tier" ON public.users;

CREATE POLICY "Users cannot update subscription_tier" ON public.users
  AS RESTRICTIVE
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    subscription_tier = (SELECT subscription_tier FROM public.users WHERE id = auth.uid())
  );
