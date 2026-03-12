"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { GenderIdentity, DatingPreference } from "@/lib/types/database"

const TOTAL_STEPS = 5

const GENDER_OPTIONS = [
  { value: "male" as const, label: "Male", emoji: "👨" },
  { value: "female" as const, label: "Female", emoji: "👩" },
  { value: "non-binary" as const, label: "Non-binary", emoji: "🧑" },
  { value: "genderqueer" as const, label: "Genderqueer", emoji: "✨" },
  { value: "prefer-not-to-say" as const, label: "Prefer not to say", emoji: "🤫" },
  { value: "other" as const, label: "Other", emoji: "💫" },
] as const

const DATING_PREFERENCE_OPTIONS = [
  { value: "male" as const, label: "Men", emoji: "👨" },
  { value: "female" as const, label: "Women", emoji: "👩" },
  { value: "non-binary" as const, label: "Non-binary people", emoji: "🧑" },
  { value: "genderqueer" as const, label: "Genderqueer people", emoji: "✨" },
  { value: "no-preference" as const, label: "No preference", emoji: "💕" },
] as const

const CHALLENGES = [
  { id: "sarcasm", label: "Reading sarcasm or jokes", emoji: "😅" },
  { id: "topics", label: "Knowing when to change topics", emoji: "🔄" },
  { id: "flirting", label: "Understanding flirting signals", emoji: "💕" },
  { id: "smalltalk", label: "Making small talk", emoji: "💬" },
  { id: "bodylang", label: "Reading body language descriptions", emoji: "🤔" },
  { id: "sharing", label: "Knowing how much to share", emoji: "🤐" },
  { id: "silences", label: "Handling awkward silences", emoji: "😶" },
  { id: "disinterest", label: "Picking up on disinterest", emoji: "👀" },
] as const

const GOALS = [
  { id: "first-dates", label: "First date conversations", emoji: "☕" },
  { id: "texting", label: "Texting and messaging", emoji: "📱" },
  { id: "deepening", label: "Deepening connections", emoji: "💗" },
  { id: "difficult", label: "Handling difficult moments", emoji: "🌊" },
  { id: "confidence", label: "Building confidence", emoji: "✨" },
] as const

const COACHING_STYLES = [
  {
    value: "gentle" as const,
    title: "Gentle",
    description: "Encouraging, focuses on positives, soft suggestions",
    emoji: "🌸",
  },
  {
    value: "direct" as const,
    title: "Direct",
    description: "Clear, specific feedback — tells it like it is",
    emoji: "🎯",
  },
  {
    value: "detailed" as const,
    title: "Detailed",
    description: "In-depth explanations of social dynamics",
    emoji: "📖",
  },
] as const

type CoachingStyle = "gentle" | "direct" | "detailed"

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
}

export function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [gender, setGender] = useState<GenderIdentity | null>(null)
  const [genderCustom, setGenderCustom] = useState("")
  const [datingPreference, setDatingPreference] = useState<DatingPreference | null>(null)
  const [challenges, setChallenges] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle | null>(null)

  function toggleItem(
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    )
  }

  function canAdvance(): boolean {
    switch (currentStep) {
      case 1:
        return displayName.trim().length > 0
      case 2:
        if (!gender) return false
        if (gender === "other" && !genderCustom.trim()) return false
        return datingPreference !== null
      case 3:
        return challenges.length > 0
      case 4:
        return goals.length > 0
      case 5:
        return coachingStyle !== null
      default:
        return false
    }
  }

  function goNext() {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleComplete() {
    if (!canAdvance()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/users/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          onboarding_profile: {
            gender,
            ...(gender === "other" && genderCustom.trim()
              ? { gender_custom: genderCustom.trim() }
              : {}),
            dating_preference: datingPreference,
            challenges,
            goals,
            preferred_coaching_style: coachingStyle,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Failed to save your profile")
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <Card className="w-full max-w-lg shadow-xl">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step content with transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {currentStep === 1 && (
            <StepWelcome
              displayName={displayName}
              setDisplayName={setDisplayName}
            />
          )}
          {currentStep === 2 && (
            <StepGenderPreferences
              gender={gender}
              setGender={setGender}
              genderCustom={genderCustom}
              setGenderCustom={setGenderCustom}
              datingPreference={datingPreference}
              setDatingPreference={setDatingPreference}
            />
          )}
          {currentStep === 3 && (
            <StepChallenges
              selected={challenges}
              toggle={(item) => toggleItem(challenges, setChallenges, item)}
            />
          )}
          {currentStep === 4 && (
            <StepGoals
              selected={goals}
              toggle={(item) => toggleItem(goals, setGoals, item)}
            />
          )}
          {currentStep === 5 && (
            <StepCoachingStyle
              selected={coachingStyle}
              setSelected={setCoachingStyle}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-2">
        {error && (
          <p className="w-full rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={goBack}
            disabled={currentStep === 1 || submitting}
          >
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              className={cn(
                "flex-1 font-medium",
              )}
              onClick={goNext}
              disabled={!canAdvance()}
            >
              Next
            </Button>
          ) : (
            <Button
              className={cn(
                "flex-1 font-medium",
              )}
              onClick={handleComplete}
              disabled={!canAdvance() || submitting}
            >
              {submitting ? "Saving…" : "Let's Go! 🚀"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

/* ───────────────────── Step Components ───────────────────── */

function StepWelcome({
  displayName,
  setDisplayName,
}: {
  displayName: string
  setDisplayName: (v: string) => void
}) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <Image src="/logo.png" alt="Cuetie" width={64} height={64} className="h-16 w-16 mx-auto" />
        </div>
        <CardTitle className="text-xl">
          Hi! I&apos;m Cuetie, your dating communication coach.
        </CardTitle>
        <CardDescription className="mt-2 text-sm leading-relaxed">
          I&apos;m here to help you feel more confident navigating conversations.
          Let&apos;s start with a quick intro — it only takes a minute!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6">
        <Label htmlFor="display-name" className="text-sm font-medium">
          What should I call you?
        </Label>
        <Input
          id="display-name"
          placeholder="Your name or nickname"
          value={displayName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDisplayName(e.target.value)
          }
          autoFocus
        />
      </CardContent>
    </>
  )
}

function StepGenderPreferences({
  gender,
  setGender,
  genderCustom,
  setGenderCustom,
  datingPreference,
  setDatingPreference,
}: {
  gender: GenderIdentity | null
  setGender: (v: GenderIdentity) => void
  genderCustom: string
  setGenderCustom: (v: string) => void
  datingPreference: DatingPreference | null
  setDatingPreference: (v: DatingPreference) => void
}) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          A little about you
        </CardTitle>
        <CardDescription className="mt-1 text-sm leading-relaxed">
          This helps me personalize your practice conversations
          so they feel more realistic and relevant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6">
        {/* Gender Identity */}
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">How do you identify?</Label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt.value}
                label={opt.label}
                emoji={opt.emoji}
                active={gender === opt.value}
                onClick={() => setGender(opt.value)}
              />
            ))}
          </div>
          {gender === "other" && (
            <Input
              placeholder="How do you identify?"
              value={genderCustom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGenderCustom(e.target.value)
              }
              className="mt-2"
              autoFocus
            />
          )}
        </div>

        {/* Dating Preference */}
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">Who are you interested in dating?</Label>
          <div className="grid grid-cols-2 gap-2">
            {DATING_PREFERENCE_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt.value}
                label={opt.label}
                emoji={opt.emoji}
                active={datingPreference === opt.value}
                onClick={() => setDatingPreference(opt.value)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </>
  )
}

function StepChallenges({
  selected,
  toggle,
}: {
  selected: string[]
  toggle: (item: string) => void
}) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          What feels tricky for you?
        </CardTitle>
        <CardDescription className="mt-1 text-sm leading-relaxed">
          Pick any that resonate — no judgment here. This helps me tailor my
          coaching to what matters most to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {CHALLENGES.map((c) => (
            <ToggleChip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              active={selected.includes(c.label)}
              onClick={() => toggle(c.label)}
            />
          ))}
        </div>
      </CardContent>
    </>
  )
}

function StepGoals({
  selected,
  toggle,
}: {
  selected: string[]
  toggle: (item: string) => void
}) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          What would you love to get better at?
        </CardTitle>
        <CardDescription className="mt-1 text-sm leading-relaxed">
          Select the areas where you&apos;d like the most support.
          We&apos;ll create practice sessions tailored just for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GOALS.map((g) => (
            <ToggleChip
              key={g.id}
              label={g.label}
              emoji={g.emoji}
              active={selected.includes(g.label)}
              onClick={() => toggle(g.label)}
            />
          ))}
        </div>
      </CardContent>
    </>
  )
}

function StepCoachingStyle({
  selected,
  setSelected,
}: {
  selected: CoachingStyle | null
  setSelected: (v: CoachingStyle) => void
}) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          How would you like me to coach you?
        </CardTitle>
        <CardDescription className="mt-1 text-sm leading-relaxed">
          Everyone learns differently — pick the style that feels right.
          You can always change this later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6">
        {COACHING_STYLES.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => setSelected(style.value)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
              "hover:border-primary/40 hover:bg-primary/5",
              selected === style.value
                ? "border-primary/50 bg-primary/5 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <span className="mt-0.5 text-2xl">{style.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">{style.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {style.description}
              </p>
            </div>
            <div
              className={cn(
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selected === style.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {selected === style.value && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </>
  )
}

/* ─────────────── Shared Toggle Chip ─────────────── */

function ToggleChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left text-sm font-medium transition-all",
        "hover:border-primary/40 hover:bg-primary/5",
        active
          ? "border-primary/50 bg-primary/5 text-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground"
      )}
    >
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 leading-snug">{label}</span>
      {active && (
        <svg
          className="h-4 w-4 shrink-0 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  )
}
