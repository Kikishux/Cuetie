"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SafeMotion, SafeAnimatePresence } from "@/components/shared/SafeMotion";
import { useSensoryOptional } from "@/components/shared/SensoryProvider";
import { BarChart3, BrainCircuit, ChevronDown, ChevronUp, Mic } from "lucide-react";
import CoachingCard from "@/components/chat/CoachingCard";
import { DeepEmotionCard } from "@/components/chat/DeepEmotionCard";
import { PremiumUpgradePrompt } from "@/components/chat/PremiumUpgradePrompt";
import type { VoiceCoaching } from "@/lib/ai/voice-coaching";
import type { CoachingData, SkillId } from "@/lib/types/database";
import type { HumeEmotionResult } from "@/lib/types/hume";

interface CoachingPanelProps {
  coaching: CoachingData | null;
  voiceCoaching?: VoiceCoaching | null;
  humeEmotions?: HumeEmotionResult | null;
  humeAnalysisLimitReached?: boolean;
}

const skillLabels: Record<SkillId, string> = {
  empathy: "Empathy",
  question_quality: "Questions",
  topic_flow: "Topic Flow",
  cue_detection: "Cue Detection",
  tone_matching: "Tone Matching",
  conversation_pacing: "Pacing",
  self_disclosure: "Self-Disclosure",
  active_listening: "Active Listening",
};

const emotionEmojis: Record<string, string> = {
  nervous: "😰",
  confident: "💪",
  warm: "🌟",
  flat: "😐",
  excited: "🎉",
  anxious: "😟",
  friendly: "😊",
  hesitant: "🤔",
  enthusiastic: "✨",
};

export default function CoachingPanel({
  coaching,
  voiceCoaching,
  humeEmotions,
  humeAnalysisLimitReached = false,
}: CoachingPanelProps) {
  const { isCondensed, isQuietSession } = useSensoryOptional();
  const [showVoiceDetails, setShowVoiceDetails] = useState(false);

  const voiceTone = coaching?.voice_tone;
  const derivedHumeEmotions: HumeEmotionResult | null = coaching?.hume_emotions
    ? {
        ...coaching.hume_emotions,
        rawScores: Object.fromEntries(
          coaching.hume_emotions.topEmotions.map((emotion) => [
            emotion.name,
            emotion.score,
          ])
        ),
      }
    : null;
  const resolvedHumeEmotions = humeEmotions ?? derivedHumeEmotions;

  // In condensed mode, voice details are collapsed by default
  const shouldShowVoiceDetails = isCondensed ? showVoiceDetails : true;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <BrainCircuit className="h-4 w-4" />
        Coaching Insights
      </h2>

      <SafeAnimatePresence mode="wait">
        {coaching ? (
          <SafeMotion
            key={coaching.cue_decoded}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CoachingCard coaching={coaching} />
          </SafeMotion>
        ) : (
          <SafeMotion
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center"
          >
            <div className="rounded-full bg-muted p-3">
              <BrainCircuit className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Start chatting to receive coaching insights
            </p>
          </SafeMotion>
        )}
      </SafeAnimatePresence>

      {/* Voice Tone Analysis */}
      {voiceTone && (
        <SafeMotion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-xl border bg-card p-4"
        >
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Mic className="h-3.5 w-3.5" />
            Vocal Delivery
            {isCondensed && (
              <button
                type="button"
                onClick={() => setShowVoiceDetails((p) => !p)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                {showVoiceDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </h3>

          {/* Emotion badge — always visible */}
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {emotionEmojis[voiceTone.detected_emotion.toLowerCase()] ?? "🎤"}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {voiceTone.detected_emotion}
            </span>
            {/* In condensed mode, show scores inline as text instead of bars */}
            {isCondensed && !showVoiceDetails && (
              <span className="text-xs text-muted-foreground">
                · {voiceTone.confidence_level}/10 confidence
              </span>
            )}
          </div>

          {/* Detailed bars — shown based on density */}
          {shouldShowVoiceDetails && (
            <>
              {/* Confidence bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <span>{voiceTone.confidence_level}/10</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${voiceTone.confidence_level * 10}%` }}
                  />
                </div>
              </div>

              {/* Expressiveness bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Expressiveness</span>
                  <span>{voiceTone.expressiveness}/10</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${voiceTone.expressiveness * 10}%` }}
                  />
                </div>
              </div>

              {/* Energy match */}
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Energy:</span>{" "}
                {voiceTone.energy_match}
              </p>
            </>
          )}

          {/* Vocal tip — always visible */}
          <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
            💡 {voiceTone.suggestion}
          </p>
        </SafeMotion>
      )}

      {/* Voice Metrics — collapsed in condensed mode */}
      {voiceCoaching &&
        (voiceCoaching.filler_words.count > 0 ||
          voiceCoaching.pacing ||
          voiceCoaching.response_time) &&
        shouldShowVoiceDetails && (
          <SafeMotion
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border bg-card p-4"
          >
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              Voice Metrics
            </h3>

            {/* Filler Words */}
            {voiceCoaching.filler_words.count > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Filler Words</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {voiceCoaching.filler_words.count} detected
                  </span>
                </div>
                {voiceCoaching.filler_words.words.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Words: {voiceCoaching.filler_words.words.join(", ")}
                  </p>
                )}
                <p className="border-l-2 border-amber-300/50 pl-2 text-xs italic text-muted-foreground">
                  💡 {voiceCoaching.filler_words.feedback}
                </p>
              </div>
            )}

            {/* Pacing */}
            {voiceCoaching.pacing && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Speaking Pace</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      voiceCoaching.pacing.rating === "good"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {voiceCoaching.pacing.wpm} WPM · {voiceCoaching.pacing.rating}
                  </span>
                </div>
                <p className="border-l-2 border-primary/30 pl-2 text-xs italic text-muted-foreground">
                  💡 {voiceCoaching.pacing.feedback}
                </p>
              </div>
            )}

            {/* Response Time */}
            {voiceCoaching.response_time && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Response Time</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      voiceCoaching.response_time.rating === "natural"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {voiceCoaching.response_time.seconds.toFixed(1)}s · {voiceCoaching.response_time.rating}
                  </span>
                </div>
                <p className="border-l-2 border-primary/30 pl-2 text-xs italic text-muted-foreground">
                  💡 {voiceCoaching.response_time.feedback}
                </p>
              </div>
            )}
          </SafeMotion>
        )}

      {resolvedHumeEmotions && !isCondensed && (
        <DeepEmotionCard emotions={resolvedHumeEmotions} />
      )}

      {humeAnalysisLimitReached && <PremiumUpgradePrompt />}
    </div>
  );
}
