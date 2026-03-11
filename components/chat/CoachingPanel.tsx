"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { BrainCircuit } from "lucide-react";
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
