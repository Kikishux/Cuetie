"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import type { SkillId } from "@/lib/types/database"

const SKILL_LABELS: Record<SkillId, string> = {
  empathy: "Empathy",
  question_quality: "Questions",
  topic_flow: "Topic Flow",
  cue_detection: "Cue Reading",
  tone_matching: "Tone",
  conversation_pacing: "Pacing",
  self_disclosure: "Sharing",
  active_listening: "Listening",
}

interface SkillRadarChartProps {
  skills: Record<string, { currentScore: number }>
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
  const hasData = Object.values(skills).some((s) => s.currentScore > 0)

  const data = (Object.keys(SKILL_LABELS) as SkillId[]).map((id) => ({
    skill: SKILL_LABELS[id],
    score: skills[id]?.currentScore ?? 0,
    fullMark: 100,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Skills Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Complete your first session to see your skill map!
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(330 80% 55%)"
                  fill="hsl(330 80% 55%)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
