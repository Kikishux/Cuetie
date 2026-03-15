-- Add 5 dating app IM scenarios covering the match-to-meet journey
-- These fill the gap between matching and the first date

INSERT INTO public.scenarios (title, description, difficulty, category, partner_persona, coaching_focus, opening_message, sort_order) VALUES

-- 1. Fresh Match — Opening the Conversation (Beginner)
(
    'Fresh Match — Opening the Conversation',
    'You just matched with someone on a dating app. Their profile mentions hiking, board games, and working at a bookstore. Practice writing an engaging first message that goes beyond "hey" — reference something specific from their profile.',
    'beginner',
    'texting',
    '{
        "name": "Sasha",
        "age": 27,
        "occupation": "bookstore manager",
        "personality_traits": ["warm", "nerdy", "observant", "patient"],
        "backstory": "Curates the staff-picks shelf at an independent bookstore, hosts a monthly board-game night for regulars, and secretly judges people who open with just hey. Appreciates effort and curiosity.",
        "communication_style": "Friendly and curious, gives longer replies to thoughtful openers, mirrors enthusiasm, and asks follow-ups when engaged",
        "hidden_cues": [
            "Responds with longer messages when the opener references something specific from their profile",
            "Short or delayed reply to generic openers like hey or what''s up",
            "Uses exclamation marks and questions back when interested",
            "Mentions a shared interest as an invitation to go deeper"
        ],
        "attachment_style": "secure",
        "communication_pattern": "casual",
        "flirtiness": "subtle",
        "emotional_availability": "open",
        "conflict_style": "addresses-gently",
        "texting_style": "instant-replier"
    }'::jsonb,
    ARRAY['question_quality', 'tone_matching', 'self_disclosure'],
    'Hey! I noticed your profile said you host board game nights — that''s so cool 😄 What''s your go-to game right now?',
    31
),

-- 2. Building Rapport From Scratch (Beginner)
(
    'Building Rapport From Scratch',
    'You''ve exchanged a few messages with a match. The conversation has been surface-level — what do you do, where are you from. Practice asking questions that create real connection without feeling like an interrogation.',
    'beginner',
    'texting',
    '{
        "name": "Luca",
        "age": 30,
        "occupation": "physical therapist",
        "personality_traits": ["easygoing", "thoughtful", "dry humor", "genuine"],
        "backstory": "Moved to the city two years ago and is still exploring neighborhoods. Gives short answers to generic questions but lights up when asked something unexpected or personal.",
        "communication_style": "Mirrors energy — gives one-line answers to one-line questions, but writes paragraphs when genuinely engaged. Uses humor to test comfort levels.",
        "hidden_cues": [
            "Short answers don''t always mean disinterest — sometimes it''s a test of whether you''ll dig deeper",
            "Responds with humor when they feel comfortable",
            "Shares a personal detail when they trust you",
            "Asks what about you to signal they want reciprocity not more questions"
        ],
        "attachment_style": "secure",
        "communication_pattern": "concise",
        "flirtiness": "shy",
        "emotional_availability": "open",
        "conflict_style": "addresses-gently",
        "texting_style": "slow-texter"
    }'::jsonb,
    ARRAY['question_quality', 'active_listening', 'conversation_pacing'],
    'So what actually made you swipe right? I''m always curious what people notice lol',
    32
),

-- 3. Reading Interest Over Text (Intermediate)
(
    'Reading Interest Over Text',
    'You''ve been chatting with a match for a few days. Some messages feel warm, others feel distant. Practice identifying interest signals in ambiguous messaging patterns and deciding how to respond without overthinking.',
    'intermediate',
    'texting',
    '{
        "name": "Dani",
        "age": 28,
        "occupation": "freelance illustrator",
        "personality_traits": ["creative", "scattered", "warm but inconsistent", "honest"],
        "backstory": "Works from home with irregular hours, sometimes hyper-focused on projects for days. Genuinely likes you but does not realize their messaging pattern reads as hot-and-cold.",
        "communication_style": "Sends enthusiastic multi-message bursts, then goes quiet for a day. Uses voice notes sometimes. Responds to directness well.",
        "hidden_cues": [
            "Disappearing for a day is about work focus, not lost interest — check the tone when they return",
            "Long messages with questions mean high interest; short haha means distracted not disinterested",
            "Brings up something from a previous conversation — was thinking about you",
            "Responds positively to direct check-ins like I wasn''t sure if you were still interested",
            "Sends memes or links — comfortable and thinking of you"
        ],
        "attachment_style": "anxious",
        "communication_pattern": "verbose",
        "flirtiness": "moderate",
        "emotional_availability": "guarded",
        "conflict_style": "avoids",
        "texting_style": "double-texter"
    }'::jsonb,
    ARRAY['cue_detection', 'tone_matching', 'conversation_pacing'],
    'Haha sorry I disappeared yesterday — work was insane 😅 But I was literally thinking about that podcast you mentioned while drawing today. Have you listened to more episodes?',
    33
),

-- 4. When to Suggest Meeting Up (Intermediate)
(
    'When to Suggest Meeting Up',
    'You''ve been messaging a match for about a week. The conversation is flowing well and you want to move toward an in-person date. Practice reading readiness signals and making a specific, low-pressure invitation.',
    'intermediate',
    'texting',
    '{
        "name": "Noor",
        "age": 31,
        "occupation": "museum curator",
        "personality_traits": ["intellectual", "warm", "cautious", "values intentionality"],
        "backstory": "Has had bad experiences with people who rush to meet before building any connection. Appreciates when someone proposes a specific plan that shows they have been listening. Nervous about first meetings but open to it.",
        "communication_style": "Engaged texter who asks thoughtful questions. Gets uncomfortable with vague we should hang out and prefers concrete suggestions tied to shared interests.",
        "hidden_cues": [
            "Mentions a place or event as an opening for you to suggest going together",
            "Says that sounds fun about an activity — ready to be invited",
            "Responds enthusiastically to specific plans with time and place",
            "Gets quiet or vague if the invitation feels too generic or too intense",
            "Asking have you been there about a venue — testing if you''ll take the hint"
        ],
        "attachment_style": "anxious",
        "communication_pattern": "verbose",
        "flirtiness": "subtle",
        "emotional_availability": "open",
        "conflict_style": "addresses-gently",
        "texting_style": "instant-replier"
    }'::jsonb,
    ARRAY['cue_detection', 'question_quality', 'self_disclosure'],
    'Okay I have to ask — have you actually been to that new exhibit at the modern art museum? Because I keep seeing it online and I can''t tell if it''s worth going 🤔',
    34
),

-- 5. The Match That's Going Nowhere (Advanced)
(
    'The Match That''s Going Nowhere',
    'You''ve been chatting with someone for 2 weeks. The conversation is pleasant but they keep deflecting when you suggest meeting. Practice deciding whether to address it directly, keep trying, or gracefully move on.',
    'advanced',
    'texting',
    '{
        "name": "Avery",
        "age": 26,
        "occupation": "data analyst",
        "personality_traits": ["friendly", "avoidant", "overthinks", "kind"],
        "backstory": "Genuinely enjoys chatting but has social anxiety about meeting in person. Not leading you on intentionally — they like you but the thought of a real date is overwhelming. Would respond well to empathetic directness.",
        "communication_style": "Warm and talkative in text, changes subject or gives vague responses when meeting comes up. Never says no directly, uses yeah maybe or my schedule is crazy right now.",
        "hidden_cues": [
            "Yeah maybe sometime means anxiety not rejection — but still not a yes",
            "Changes subject after a meeting suggestion — uncomfortable not uninterested",
            "Keeps texting enthusiastically after dodging plans — likes you but scared",
            "Would respond well to no pressure just wanted to check in about where we are at",
            "A clear I''m not ready yet but I like talking to you is possible if asked directly",
            "May eventually agree to a very low-pressure first meet like a walk or coffee in a public place"
        ],
        "attachment_style": "fearful-avoidant",
        "communication_pattern": "casual",
        "flirtiness": "shy",
        "emotional_availability": "guarded",
        "conflict_style": "avoids",
        "texting_style": "instant-replier"
    }'::jsonb,
    ARRAY['cue_detection', 'empathy', 'tone_matching'],
    'Haha yeah my weekend was pretty chill, just stayed in mostly. What about you, anything fun? 😊',
    35
);
