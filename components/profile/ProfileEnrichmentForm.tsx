"use client"

import { useState } from "react"
import { Save, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import CollapsiblePanel from "@/components/ui/collapsible-panel"
import InterestPicker from "@/components/profile/InterestPicker"
import {
  ProfileEnrichment,
  CommunicationMethod,
  ResponseRhythm,
  CommunicationFrequency,
  ToneTrait,
  ConversationPref,
  NeurodivergentIdentity,
  NeurodivergentTrait,
  SupportPreference,
} from "@/lib/types/profile"

interface ProfileEnrichmentFormProps {
  initialData?: ProfileEnrichment
}

export default function ProfileEnrichmentForm({ initialData }: ProfileEnrichmentFormProps) {
  const [form, setForm] = useState<ProfileEnrichment>(initialData ?? {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function update<K extends keyof ProfileEnrichment>(key: K, value: ProfileEnrichment[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleSingle<T>(current: T | undefined, val: T): T | undefined {
    return current === val ? undefined : val
  }

  function toggleArray<T>(arr: T[] | undefined, val: T): T[] {
    const current = arr ?? []
    return current.includes(val) ? current.filter(x => x !== val) : [...current, val]
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSaveError(data?.error ?? "Failed to save profile")
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      setSaveError("Failed to save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Section A helpers
  const methodLabels: Record<CommunicationMethod, string> = {
    text: "Text",
    phone_call: "Phone Call",
    voice_notes: "Voice Notes",
    video_call: "Video Call",
    in_person: "In Person",
  }
  const rhythmLabels: Record<ResponseRhythm, string> = {
    quick: "Quick replies",
    thoughtful: "Thoughtful replies",
    varies: "It varies",
  }
  const frequencyLabels: Record<CommunicationFrequency, string> = {
    daily: "Daily",
    few_times_week: "A few times a week",
    flexible: "Flexible",
  }

  const sectionASummaryParts: string[] = []
  if (form.communication_methods?.length) {
    sectionASummaryParts.push(form.communication_methods.map(m => methodLabels[m]).join(", "))
  }
  if (form.response_rhythm) sectionASummaryParts.push(rhythmLabels[form.response_rhythm])
  if (form.communication_frequency) sectionASummaryParts.push(frequencyLabels[form.communication_frequency])
  const sectionASummary = sectionASummaryParts.join(" · ")
  const sectionAComplete = !!(
    form.communication_methods?.length ||
    form.response_rhythm ||
    form.communication_frequency
  )

  // Section B helpers
  const toneLabels: Record<ToneTrait, string> = {
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
  const sectionBSummary = form.tone_traits?.map(t => toneLabels[t]).join(", ") ?? ""
  const sectionBComplete = !!(form.tone_traits?.length)

  // Section C helpers
  const convPrefLabels: Record<ConversationPref, string> = {
    deep: "Deep conversations",
    light_fun: "Light & fun chats",
    asking_questions: "Asking questions",
    listening_first: "Listening first",
    exchanging_ideas: "Exchanging ideas",
    storytelling: "Sharing stories",
  }
  const sectionCSummary = form.conversation_preferences?.map(p => convPrefLabels[p]).join(", ") ?? ""
  const sectionCComplete = !!(form.conversation_preferences?.length)

  // Section D helpers
  const interests = form.interests ?? []
  const sectionDSummary = interests.length === 0
    ? ""
    : interests.length > 3
      ? interests.slice(0, 3).join(", ") + ", and more"
      : interests.join(", ")
  const sectionDComplete = interests.length > 0

  // Section E helpers
  const traitLabels: Record<NeurodivergentTrait, string> = {
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
  const supportPrefLabels: Record<SupportPreference, string> = {
    clear_direct: "Clear & direct",
    processing_time: "Processing time",
    written_preferred: "Written preferred",
    structured_plans: "Structured plans",
    flexible_plans: "Flexible plans",
  }
  const identity = form.neurodivergent_identity
  let sectionESummary = ""
  if (identity === undefined) {
    sectionESummary = ""
  } else if (identity === "prefer_not_to_say") {
    sectionESummary = "Prefer not to say"
  } else if (identity === "no") {
    sectionESummary = "Not neurodivergent"
  } else if (identity === "yes") {
    sectionESummary = form.neurodivergent_traits?.length
      ? form.neurodivergent_traits.map(t => traitLabels[t]).join(", ")
      : "Yes, neurodivergent"
  }
  const sectionEComplete = identity !== undefined

  return (
    <div className="space-y-3">
      {/* Section A: Communication Preferences */}
      <CollapsiblePanel
        title="Communication Preferences"
        defaultOpen={true}
        summary={sectionASummary}
        completionBadge={sectionAComplete}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>How do you prefer to connect?</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(methodLabels) as CommunicationMethod[]).map(val => {
                const selected = form.communication_methods?.includes(val) ?? false
                return (
                  <Badge
                    key={val}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => update("communication_methods", toggleArray(form.communication_methods, val))}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {methodLabels[val]}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How quickly do you reply?</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(rhythmLabels) as ResponseRhythm[]).map(val => {
                const selected = form.response_rhythm === val
                return (
                  <Badge
                    key={val}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => update("response_rhythm", toggleSingle(form.response_rhythm, val))}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {rhythmLabels[val]}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How often do you like to connect?</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(frequencyLabels) as CommunicationFrequency[]).map(val => {
                const selected = form.communication_frequency === val
                return (
                  <Badge
                    key={val}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => update("communication_frequency", toggleSingle(form.communication_frequency, val))}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {frequencyLabels[val]}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      </CollapsiblePanel>

      {/* Section B: Communication Style */}
      <CollapsiblePanel
        title="Communication Style"
        defaultOpen={true}
        summary={sectionBSummary}
        completionBadge={sectionBComplete}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>How would you describe your communication tone?</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(toneLabels) as ToneTrait[]).map(val => {
                const selected = form.tone_traits?.includes(val) ?? false
                return (
                  <Badge
                    key={val}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => update("tone_traits", toggleArray(form.tone_traits, val))}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {toneLabels[val]}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anything else about how you communicate? (optional)</Label>
            <Textarea
              value={form.communication_notes ?? ""}
              onChange={e => update("communication_notes", e.target.value)}
              maxLength={300}
              placeholder="E.g. I use humor a lot, or I tend to be pretty formal at first..."
            />
            <p className="text-xs text-muted-foreground">{form.communication_notes?.length ?? 0}/300</p>
          </div>
        </div>
      </CollapsiblePanel>

      {/* Section C: Conversation Preferences */}
      <CollapsiblePanel
        title="Conversation Preferences"
        defaultOpen={false}
        summary={sectionCSummary}
        completionBadge={sectionCComplete}
      >
        <div className="space-y-2">
          <Label>What kind of conversations do you enjoy?</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(convPrefLabels) as ConversationPref[]).map(val => {
              const selected = form.conversation_preferences?.includes(val) ?? false
              return (
                <Badge
                  key={val}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => update("conversation_preferences", toggleArray(form.conversation_preferences, val))}
                >
                  {selected && <Check className="mr-1 h-3 w-3" />}
                  {convPrefLabels[val]}
                </Badge>
              )
            })}
          </div>
        </div>
      </CollapsiblePanel>

      {/* Section D: Interests */}
      <CollapsiblePanel
        title="Interests"
        defaultOpen={false}
        summary={sectionDSummary}
        completionBadge={sectionDComplete}
      >
        <InterestPicker
          value={form.interests ?? []}
          onChange={(v) => update("interests", v)}
        />
      </CollapsiblePanel>

      {/* Section E: Neurodivergence (Optional) */}
      <CollapsiblePanel
        title="Neurodivergence (Optional)"
        defaultOpen={false}
        summary={sectionESummary}
        completionBadge={sectionEComplete}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">This is entirely optional. Share only what feels comfortable.</p>

          <div className="space-y-2">
            <Label>Do you identify as neurodivergent?</Label>
            <div className="flex flex-wrap gap-2">
              {([["yes", "Yes"], ["no", "No"], ["prefer_not_to_say", "Prefer not to say"]] as [NeurodivergentIdentity, string][]).map(([val, label]) => {
                const selected = form.neurodivergent_identity === val
                return (
                  <Badge
                    key={val}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => update("neurodivergent_identity", toggleSingle(form.neurodivergent_identity, val))}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {label}
                  </Badge>
                )
              })}
            </div>
          </div>

          {identity === "yes" && (
            <>
              <div className="space-y-2">
                <Label>Which of these resonate with you? (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(traitLabels) as NeurodivergentTrait[]).map(val => {
                    const selected = form.neurodivergent_traits?.includes(val) ?? false
                    return (
                      <Badge
                        key={val}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => update("neurodivergent_traits", toggleArray(form.neurodivergent_traits, val))}
                      >
                        {selected && <Check className="mr-1 h-3 w-3" />}
                        {traitLabels[val]}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>What kind of support helps you? (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(supportPrefLabels) as SupportPreference[]).map(val => {
                    const selected = form.support_preferences?.includes(val) ?? false
                    return (
                      <Badge
                        key={val}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => update("support_preferences", toggleArray(form.support_preferences, val))}
                      >
                        {selected && <Check className="mr-1 h-3 w-3" />}
                        {supportPrefLabels[val]}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anything else? (optional)</Label>
                <Textarea
                  value={form.support_notes ?? ""}
                  onChange={e => update("support_notes", e.target.value)}
                  maxLength={300}
                />
              </div>
            </>
          )}
        </div>
      </CollapsiblePanel>

      {/* Save button */}
      <div className="flex items-center gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Profile"}
        </Button>
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      </div>
    </div>
  )
}
