-- Cuetie Migration: Partner Persona Behavioral Dimensions
-- ============================================================

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "casual",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'First Coffee Date' AND sort_order = 1;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "concise",
  "flirtiness": "shy",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Getting Past Small Talk' AND sort_order = 2;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "verbose",
  "flirtiness": "moderate",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Reading Interest Signals' AND sort_order = 3;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "concise",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Handling Awkward Silences' AND sort_order = 4;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "verbose",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Sharing Personal Stories' AND sort_order = 5;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "formal",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "confrontational",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Navigating Different Opinions' AND sort_order = 6;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "emoji-heavy",
  "flirtiness": "moderate",
  "emotional_availability": "open",
  "conflict_style": "avoids",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Texting After a First Date' AND sort_order = 7;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "verbose",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "double-texter"
}'::jsonb
WHERE title = 'Planning a Second Date' AND sort_order = 8;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "casual",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Recovering a Rough Start' AND sort_order = 9;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "concise",
  "flirtiness": "shy",
  "emotional_availability": "walls-up",
  "conflict_style": "avoids",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'Deepening Emotional Connection' AND sort_order = 10;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "verbose",
  "flirtiness": "moderate",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "double-texter"
}'::jsonb
WHERE title = 'The Oversharer' AND sort_order = 11;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "concise",
  "flirtiness": "shy",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Coffee with a Quiet Person' AND sort_order = 12;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "casual",
  "flirtiness": "moderate",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Meeting at a Friend''s Party' AND sort_order = 13;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "casual",
  "flirtiness": "shy",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "double-texter"
}'::jsonb
WHERE title = 'Bumping into Your Match at a Bookstore' AND sort_order = 14;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "concise",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'The Slow Texter' AND sort_order = 15;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "emoji-heavy",
  "flirtiness": "bold",
  "emotional_availability": "open",
  "conflict_style": "avoids",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Decoding Emoji Messages' AND sort_order = 16;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "concise",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Asking Them Out Over Text' AND sort_order = 17;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "formal",
  "flirtiness": "shy",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'First Dinner Date' AND sort_order = 18;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "casual",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'They Brought a Friend' AND sort_order = 19;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "formal",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "addresses-gently",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'The Fancy Restaurant' AND sort_order = 20;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "verbose",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'First Video Date' AND sort_order = 21;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "verbose",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "avoids",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'Late Night Video Chat' AND sort_order = 22;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "formal",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "addresses-gently",
  "texting_style": "brief"
}'::jsonb
WHERE title = 'Video Call Before Meeting IRL' AND sort_order = 23;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "formal",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "addresses-gently",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'They Mentioned Their Ex' AND sort_order = 24;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "verbose",
  "flirtiness": "moderate",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "double-texter"
}'::jsonb
WHERE title = 'Accidental Oversharing' AND sort_order = 25;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "formal",
  "flirtiness": "moderate",
  "emotional_availability": "guarded",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'The DTR Talk' AND sort_order = 26;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "secure",
  "communication_pattern": "casual",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "instant-replier"
}'::jsonb
WHERE title = 'Meeting Their Friends' AND sort_order = 27;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "avoidant",
  "communication_pattern": "concise",
  "flirtiness": "subtle",
  "emotional_availability": "guarded",
  "conflict_style": "addresses-gently",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'They Cancelled Last Minute' AND sort_order = 28;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "anxious",
  "communication_pattern": "emoji-heavy",
  "flirtiness": "subtle",
  "emotional_availability": "open",
  "conflict_style": "addresses-gently",
  "texting_style": "double-texter"
}'::jsonb
WHERE title = 'Misread a Text Tone' AND sort_order = 29;

UPDATE public.scenarios
SET partner_persona = partner_persona || '{
  "attachment_style": "fearful-avoidant",
  "communication_pattern": "casual",
  "flirtiness": "subtle",
  "emotional_availability": "walls-up",
  "conflict_style": "passive-aggressive",
  "texting_style": "slow-texter"
}'::jsonb
WHERE title = 'Different Communication Needs' AND sort_order = 30;
