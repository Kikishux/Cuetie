import type { ProfileEnrichment, ToneTrait, CommunicationMethod, ConversationPref, NeurodivergentTrait, SupportPreference } from "@/lib/types/profile"

const toneTraitLabels: Record<ToneTrait, string> = {
  direct: "direct",
  warm: "warm",
  playful: "playful",
  storytelling: "a storyteller",
  thoughtful: "thoughtful",
  analytical: "analytical",
  reflective: "reflective",
  energetic: "energetic",
  reserved: "reserved",
  curious: "curious",
}

const communicationMethodLabels: Record<CommunicationMethod, string> = {
  text: "texting",
  phone_call: "phone calls",
  voice_notes: "voice notes",
  video_call: "video calls",
  in_person: "meeting in person",
}

const conversationPrefLabels: Record<ConversationPref, string> = {
  deep: "deep conversations",
  light_fun: "light, fun chats",
  asking_questions: "asking questions",
  listening_first: "listening first",
  exchanging_ideas: "exchanging ideas",
  storytelling: "sharing stories",
}

const neurodivergentTraitLabels: Record<NeurodivergentTrait, string> = {
  adhd: "ADHD",
  autistic: "autistic",
  dyslexia: "dyslexia",
  dyspraxia: "dyspraxia",
  sensory_sensitivity: "sensory sensitivity",
  hyperfocus: "hyperfocus",
  executive_function: "executive function differences",
  social_processing: "social processing differences",
  other: "other",
}

const supportPreferenceLabels: Record<SupportPreference, string> = {
  clear_direct: "clear, direct communication",
  processing_time: "processing time",
  written_preferred: "written communication",
  structured_plans: "structured plans",
  flexible_plans: "flexible plans",
}

function joinList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

export function generateProfileSummary(p: ProfileEnrichment): string {
  const sentences: string[] = []

  // Tone / communication opening sentence
  const traits = (p.tone_traits ?? []).map((t) => toneTraitLabels[t])
  const methods = (p.communication_methods ?? []).map((m) => communicationMethodLabels[m])

  if (traits.length > 0) {
    if (methods.length > 0) {
      sentences.push(
        `A ${joinList(traits)} communicator who prefers ${joinList(methods)}.`
      )
    } else {
      sentences.push(`A ${joinList(traits)} communicator.`)
    }
  }

  // Conversation preferences
  const convPrefs = (p.conversation_preferences ?? []).map((c) => conversationPrefLabels[c])
  if (convPrefs.length > 0) {
    sentences.push(`Enjoys ${joinList(convPrefs)}.`)
  }

  // Interests
  const interests = p.interests ?? []
  if (interests.length >= 2) {
    const shown = interests.slice(0, 3)
    const interestStr = shown.length === interests.length
      ? joinList(shown)
      : `${shown.join(", ")}, and more`
    sentences.push(`Into ${interestStr}.`)
  }

  // Neurodivergent identity
  if (p.neurodivergent_identity === "yes") {
    const ndTraits = (p.neurodivergent_traits ?? []).map((t) => neurodivergentTraitLabels[t])
    const supportPrefs = (p.support_preferences ?? []).map((s) => supportPreferenceLabels[s])
    const hasTraits = ndTraits.length > 0
    const hasSupport = supportPrefs.length > 0 || !!p.support_notes

    if (hasTraits || hasSupport) {
      let sentence = "Identifies as neurodivergent"
      if (hasTraits) {
        sentence += ` (${ndTraits.join(", ")})`
      }
      if (supportPrefs.length > 0) {
        sentence += ` and appreciates ${joinList(supportPrefs)}`
      }
      sentence += "."
      if (p.support_notes) {
        sentence += ` ${p.support_notes}`
      }
      sentences.push(sentence)
    }
  }

  return sentences.join(" ")
}
