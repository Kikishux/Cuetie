"use client";

import { motion } from "framer-motion";
import type { HumeEmotionResult } from "@/lib/types/hume";

const emotionEmojis: Record<string, string> = {
  joy: "😊",
  amusement: "😄",
  interest: "🤔",
  excitement: "🤩",
  admiration: "🥰",
  contentment: "😌",
  love: "❤️",
  gratitude: "🙏",
  pride: "💪",
  relief: "😮‍💨",
  satisfaction: "👍",
  desire: "✨",
  anger: "😠",
  anxiety: "😰",
  contempt: "😒",
  disgust: "🤢",
  distress: "😣",
  fear: "😨",
  guilt: "😔",
  horror: "😱",
  pain: "😖",
  sadness: "😢",
  shame: "😳",
  confusion: "😕",
  surprise: "😲",
  concentration: "🧐",
  contemplation: "🤔",
  determination: "💪",
  awkwardness: "😅",
  calmness: "😌",
  boredom: "😐",
  tiredness: "😴",
};

interface DeepEmotionCardProps {
  emotions: HumeEmotionResult;
}

export function DeepEmotionCard({ emotions }: DeepEmotionCardProps) {
  const valenceColors = {
    positive: "bg-green-500",
    negative: "bg-red-400",
    neutral: "bg-amber-400",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="text-sm">🧠</span>
          Deep Emotion Analysis
        </h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          Powered by Hume AI
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl">
          {emotionEmojis[emotions.dominantEmotion.toLowerCase()] ?? "🎭"}
        </span>
        <div>
          <span className="text-sm font-semibold capitalize">
            {emotions.dominantEmotion}
          </span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${valenceColors[emotions.emotionValence]}`}
            />
            <span className="text-xs capitalize text-muted-foreground">
              {emotions.emotionValence} tone
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {emotions.topEmotions.map((emotion) => (
          <div key={emotion.name} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <span>{emotionEmojis[emotion.name.toLowerCase()] ?? "•"}</span>
                <span className="capitalize">{emotion.name}</span>
              </span>
              <span className="text-muted-foreground">
                {Math.round(emotion.score * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${emotion.score * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
