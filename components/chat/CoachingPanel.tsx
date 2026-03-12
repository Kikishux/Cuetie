"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { BrainCircuit, Mic } from "lucide-react";
import CoachingCard from "@/components/chat/CoachingCard";
import type { CoachingData, SkillId } from "@/lib/types/database";

interface CoachingPanelProps {
  coaching: CoachingData | null;
  sessionScores?: Partial<Record<SkillId, number>>;
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
  sessionScores,
}: CoachingPanelProps) {
  const scores = sessionScores ?? coaching?.skill_scores;
  const scoreEntries = scores
    ? (Object.entries(scores) as [SkillId, number][]).filter(
        ([, v]) => v != null
      )
    : [];

  const voiceTone = coaching?.voice_tone;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <BrainCircuit className="h-4 w-4" />
        Coaching Insights
      </h2>

      <AnimatePresence mode="wait">
        {coaching ? (
          <motion.div
            key={coaching.cue_decoded}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CoachingCard coaching={coaching} />
          </motion.div>
        ) : (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Tone Analysis */}
      {voiceTone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-xl border bg-card p-4"
        >
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Mic className="h-3.5 w-3.5" />
            Vocal Delivery
          </h3>

          {/* Emotion badge */}
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {emotionEmojis[voiceTone.detected_emotion.toLowerCase()] ?? "🎤"}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {voiceTone.detected_emotion}
            </span>
          </div>

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

          {/* Vocal tip */}
          <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
            💡 {voiceTone.suggestion}
          </p>
        </motion.div>
      )}

      {/* Session skill scores */}
      {scoreEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Session Skills
          </h3>
          <div className="space-y-2.5">
            {scoreEntries.map(([skillId, score]) => (
              <Progress key={skillId} value={score * 10} max={100}>
                <ProgressLabel className="text-xs">
                  {skillLabels[skillId] ?? skillId}
                </ProgressLabel>
                <ProgressValue className="text-xs">
                  {() => score.toFixed(1)}
                </ProgressValue>
              </Progress>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
