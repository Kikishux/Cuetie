"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateProfileSummary } from "@/lib/profile/summary"
import type {
  ProfileEnrichment,
  ToneTrait,
  NeurodivergentIdentity,
} from "@/lib/types/profile"

// ── Label maps ────────────────────────────────────────────────────────────────

const communicationMethodLabels: Record<string, string> = {
  text: "Text",
  phone_call: "Phone Call",
  voice_notes: "Voice Notes",
  video_call: "Video Call",
  in_person: "In Person",
}

const toneTraitLabels: Record<ToneTrait, string> = {
  direct: "Direct",
  warm: "Warm",
  playful: "Playful",
  storytelling: "Storytelling",
  thoughtful: "Thoughtful",
  analytical: "Analytical",
  reflective: "Reflective",
  energetic: "Energetic",
  reserved: "Reserved",
  curious: "Curious",
}

const conversationPrefLabels: Record<string, string> = {
  deep: "Deep conversations",
  light_fun: "Light & fun",
  asking_questions: "Asking questions",
  listening_first: "Listening first",
  exchanging_ideas: "Exchanging ideas",
  storytelling: "Sharing stories",
}

const responseRhythmLabels: Record<string, string> = {
  quick: "Quick replies",
  thoughtful: "Thoughtful replies",
  varies: "It varies",
}

const communicationFrequencyLabels: Record<string, string> = {
  daily: "Daily",
  few_times_week: "A few times a week",
  flexible: "Flexible",
}

const neurodivergentTraitLabels: Record<string, string> = {
  adhd: "ADHD",
  autistic: "Autistic",
  dyslexia: "Dyslexia",
  dyspraxia: "Dyspraxia",
  sensory_sensitivity: "Sensory sensitivity",
  hyperfocus: "Hyperfocus",
  executive_function: "Executive function",
  social_processing: "Social processing",
  other: "Other",
}

const supportPreferenceLabels: Record<string, string> = {
  clear_direct: "Clear & direct",
  processing_time: "Processing time",
  written_preferred: "Written preferred",
  structured_plans: "Structured plans",
  flexible_plans: "Flexible plans",
}

function formatInterest(slug: string): string {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProfileCardProps {
  profile: ProfileEnrichment
  name?: string
  variant?: "compact" | "full"
  isOwnProfile?: boolean
}

// ── Compact variant ───────────────────────────────────────────────────────────

function CompactCard({ profile, name }: { profile: ProfileEnrichment; name?: string }) {
  const toneTraits = profile.tone_traits ?? []
  const interests = profile.interests ?? []

  const firstTone = toneTraits[0]
  const shownInterests = interests.slice(0, 3)
  const overflowCount = interests.length - shownInterests.length

  const hasAnyData = !!name || toneTraits.length > 0 || interests.length > 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* name row */}
      {name && (
        <p className="text-sm font-semibold">{name}</p>
      )}

      {/* tone + interests row */}
      {hasAnyData ? (
        <div className="flex flex-wrap gap-1.5 items-center">
          {firstTone && (
            <Badge variant="secondary" className="text-xs">
              {toneTraitLabels[firstTone]}
            </Badge>
          )}
          {shownInterests.map((interest) => (
            <Badge key={interest} variant="outline" className="text-xs">
              {formatInterest(interest)}
            </Badge>
          ))}
          {overflowCount > 0 && (
            <span className="text-xs text-muted-foreground">+{overflowCount} more</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Profile not yet filled in</p>
      )}
    </div>
  )
}

// ── Full variant ──────────────────────────────────────────────────────────────

function FullCard({
  profile,
  name,
  isOwnProfile,
}: {
  profile: ProfileEnrichment
  name?: string
  isOwnProfile?: boolean
}) {
  const summary = generateProfileSummary(profile)

  const communicationMethods = profile.communication_methods ?? []
  const hasCommunication =
    communicationMethods.length > 0 ||
    !!profile.response_rhythm ||
    !!profile.communication_frequency

  const toneTraits = profile.tone_traits ?? []
  const conversationPrefs = profile.conversation_preferences ?? []
  const interests = profile.interests ?? []

  const isNeurodivergent = profile.neurodivergent_identity === "yes"
  const ndTraits = profile.neurodivergent_traits ?? []
  const supportPrefs = profile.support_preferences ?? []

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Name */}
      {name && (
        <p className="text-sm font-semibold">{name}</p>
      )}

      {/* Summary */}
      {summary && (
        <p className="text-sm italic text-muted-foreground">{summary}</p>
      )}

      {/* Communication */}
      {hasCommunication && (
        <div className="space-y-1.5">
          <SectionLabel>Communication</SectionLabel>
          {communicationMethods.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {communicationMethods.map((method) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {communicationMethodLabels[method] ?? method}
                </Badge>
              ))}
            </div>
          )}
          {(profile.response_rhythm || profile.communication_frequency) && (
            <p className="text-xs text-muted-foreground">
              {[
                profile.response_rhythm
                  ? responseRhythmLabels[profile.response_rhythm]
                  : null,
                profile.communication_frequency
                  ? communicationFrequencyLabels[profile.communication_frequency]
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Tone & Style */}
      {toneTraits.length > 0 && (
        <div className="space-y-1.5">
          <SectionLabel>Tone</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {toneTraits.map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {toneTraitLabels[trait]}
              </Badge>
            ))}
          </div>
          {profile.communication_notes && (
            <p className="text-xs text-muted-foreground">{profile.communication_notes}</p>
          )}
        </div>
      )}

      {/* Conversation */}
      {conversationPrefs.length > 0 && (
        <div className="space-y-1.5">
          <SectionLabel>Conversation</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {conversationPrefs.map((pref) => (
              <Badge key={pref} variant="outline" className="text-xs">
                {conversationPrefLabels[pref] ?? pref}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="space-y-1.5">
          <SectionLabel>Interests</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {formatInterest(interest)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Neurodivergence — only if identity === 'yes' */}
      {isNeurodivergent && (
        <div className="space-y-1.5">
          <SectionLabel>Neurodivergence</SectionLabel>
          {ndTraits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ndTraits.map((trait) => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {neurodivergentTraitLabels[trait] ?? trait}
                </Badge>
              ))}
            </div>
          )}
          {supportPrefs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {supportPrefs.map((pref) => (
                <Badge key={pref} variant="outline" className="text-xs">
                  {supportPreferenceLabels[pref] ?? pref}
                </Badge>
              ))}
            </div>
          )}
          {isOwnProfile && profile.support_notes && (
            <p className="text-xs text-muted-foreground">{profile.support_notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ProfileCard({
  profile,
  name,
  variant = "compact",
  isOwnProfile,
}: ProfileCardProps) {
  if (variant === "full") {
    return <FullCard profile={profile} name={name} isOwnProfile={isOwnProfile} />
  }
  return <CompactCard profile={profile} name={name} />
}
