import { z } from "zod"

export type CommunicationMethod = 'text' | 'phone_call' | 'voice_notes' | 'video_call' | 'in_person';
export type ResponseRhythm = 'quick' | 'thoughtful' | 'varies';
export type CommunicationFrequency = 'daily' | 'few_times_week' | 'flexible';
export type ToneTrait = 'direct' | 'warm' | 'playful' | 'storytelling' | 'thoughtful' |
  'analytical' | 'reflective' | 'energetic' | 'reserved' | 'curious';
export type ConversationPref = 'deep' | 'light_fun' | 'asking_questions' | 'listening_first' |
  'exchanging_ideas' | 'storytelling';
export type NeurodivergentIdentity = 'yes' | 'no' | 'prefer_not_to_say';
export type NeurodivergentTrait =
  | 'adhd' | 'arfid' | 'attachment_trauma' | 'autism' | 'bipolar' | 'bpd'
  | 'cerebral_palsy' | 'depression' | 'down_syndrome' | 'dpd' | 'dyslexia' | 'dyspraxia'
  | 'hallucination' | 'intellectual_disability' | 'mood_swing' | 'ocd'
  | 'recovery_people_pleaser' | 'social_anxiety' | 'stutter' | 'tourettes';
export type SupportPreference = 'clear_direct' | 'processing_time' | 'written_preferred' |
  'structured_plans' | 'flexible_plans';

export interface ProfileEnrichment {
  communication_methods?: CommunicationMethod[];
  response_rhythm?: ResponseRhythm;
  communication_frequency?: CommunicationFrequency;
  tone_traits?: ToneTrait[];
  communication_notes?: string;            // free text, max 300 chars
  conversation_preferences?: ConversationPref[];
  interests?: string[];                    // max 10 slugs
  neurodivergent_identity?: NeurodivergentIdentity;
  neurodivergent_traits?: NeurodivergentTrait[];
  support_preferences?: SupportPreference[];
  support_notes?: string;                  // free text, max 300 chars
}

export const profileEnrichmentSchema = z.object({
  communication_methods: z.array(
    z.enum(['text', 'phone_call', 'voice_notes', 'video_call', 'in_person'])
  ).optional(),
  response_rhythm: z.enum(['quick', 'thoughtful', 'varies']).optional(),
  communication_frequency: z.enum(['daily', 'few_times_week', 'flexible']).optional(),
  tone_traits: z.array(
    z.enum(['direct', 'warm', 'playful', 'storytelling', 'thoughtful',
      'analytical', 'reflective', 'energetic', 'reserved', 'curious'])
  ).optional(),
  communication_notes: z.string().max(300).optional(),
  conversation_preferences: z.array(
    z.enum(['deep', 'light_fun', 'asking_questions', 'listening_first',
      'exchanging_ideas', 'storytelling'])
  ).optional(),
  interests: z.array(z.string()).max(10).optional(),
  neurodivergent_identity: z.enum(['yes', 'no', 'prefer_not_to_say']).optional(),
  neurodivergent_traits: z.array(
    z.enum(['adhd', 'arfid', 'attachment_trauma', 'autism', 'bipolar', 'bpd',
      'cerebral_palsy', 'depression', 'down_syndrome', 'dpd', 'dyslexia', 'dyspraxia',
      'hallucination', 'intellectual_disability', 'mood_swing', 'ocd',
      'recovery_people_pleaser', 'social_anxiety', 'stutter', 'tourettes'])
  ).optional(),
  support_preferences: z.array(
    z.enum(['clear_direct', 'processing_time', 'written_preferred',
      'structured_plans', 'flexible_plans'])
  ).optional(),
  support_notes: z.string().max(300).optional(),
});
