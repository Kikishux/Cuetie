"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, CalendarDays } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useProgress, type SkillProgress } from "@/lib/hooks/useProgress"
import type { SkillId } from "@/lib/types/database"

const SKILL_META: Record<
  SkillId,
  { label: string; description: string; color: string }
> = {
  empathy: {
    label: "Empathy",
    description: "Understanding and sharing feelings",
    color: "#ec4899",
  },
  question_quality: {
    label: "Question Quality",
    description: "Asking meaningful, open-ended questions",
    color: "#8b5cf6",
  },
  topic_flow: {
    label: "Topic Flow",
    description: "Navigating conversations smoothly",
    color: "#3b82f6",
  },
  cue_detection: {
    label: "Cue Detection",
    description: "Recognizing social and emotional cues",
    color: "#14b8a6",
  },
  tone_matching: {
    label: "Tone Matching",
    description: "Adapting your tone to the conversation",
    color: "#f59e0b",
  },
  conversation_pacing: {
    label: "Pacing",
    description: "Balancing listening and speaking",
    color: "#ef4444",
  },
  self_disclosure: {
    label: "Self-Disclosure",
    description: "Sharing about yourself at the right level",
    color: "#10b981",
  },
  active_listening: {
    label: "Active Listening",
    description: "Showing you hear and understand",
    color: "#6366f1",
  },
}

const SKILL_IDS = Object.keys(SKILL_META) as SkillId[]

const CHART_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#6366f1",
]

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return <TrendingUp className="size-4 text-green-500" />
  if (trend === "down")
    return <TrendingDown className="size-4 text-red-500" />
  return <Minus className="size-4 text-muted-foreground" />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-muted/60" />
      <div className="h-80 rounded-xl bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/60" />
        ))}
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const { skills, recentSessions, sessionsCompleted, isLoading, error } =
    useProgress()
  const [activeTab, setActiveTab] = useState("all")

  const { bestSkill, weakestSkill } = useMemo(() => {
    const entries = Object.entries(skills).filter(
      ([, v]) => (v as SkillProgress).currentScore > 0
    ) as [SkillId, SkillProgress][]

    if (entries.length === 0) return { bestSkill: null, weakestSkill: null }

    const sorted = [...entries].sort(
      (a, b) => b[1].currentScore - a[1].currentScore
    )
    return { bestSkill: sorted[0][0], weakestSkill: sorted[sorted.length - 1][0] }
  }, [skills])

  // Build unified timeline data for "all skills" chart
  const allChartData = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {}
    for (const [skillId, skill] of Object.entries(skills)) {
      for (const point of (skill as SkillProgress).history) {
        const date = formatDate(point.date)
        if (!dateMap[date]) dateMap[date] = {}
        dateMap[date][skillId] = point.score
      }
    }
    return Object.entries(dateMap)
      .map(([date, scores]) => ({ date, ...scores }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
  }, [skills])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ProgressSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const hasData = sessionsCompleted > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          Progress & Analytics 📊
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your growth across all communication skills.
        </p>
      </motion.div>

      {!hasData ? (
        <Card className="py-12">
          <CardContent className="text-center space-y-3">
            <p className="text-3xl">🌱</p>
            <p className="font-medium">No progress data yet</p>
            <p className="text-sm text-muted-foreground">
              Complete a practice session to start tracking your skills!
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Practicing
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Callouts */}
          {(bestSkill || weakestSkill) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {bestSkill && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">
                          Best Skill
                        </p>
                        <p className="font-semibold">
                          {SKILL_META[bestSkill].label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score:{" "}
                          {(skills[bestSkill] as SkillProgress).currentScore.toFixed(1)}/10
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {weakestSkill && weakestSkill !== bestSkill && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="text-2xl">🌱</span>
                      <div>
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          Needs Most Work
                        </p>
                        <p className="font-semibold">
                          {SKILL_META[weakestSkill].label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score:{" "}
                          {(skills[weakestSkill] as SkillProgress).currentScore.toFixed(1)}/10
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}

          {/* Skill charts with tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skill Trends</CardTitle>
              <CardDescription>
                Score progression over your practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="all">All Skills</TabsTrigger>
                  {SKILL_IDS.map((id) => (
                    <TabsTrigger key={id} value={id}>
                      {SKILL_META[id].label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all">
                  {allChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={allChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fontSize: 11 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                          }}
                        />
                        {SKILL_IDS.map((id, i) => (
                          <Line
                            key={id}
                            type="monotone"
                            dataKey={id}
                            name={SKILL_META[id].label}
                            stroke={CHART_COLORS[i]}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Not enough data to chart yet.
                    </p>
                  )}
                </TabsContent>

                {SKILL_IDS.map((id, i) => {
                  const skill = skills[id] as SkillProgress | undefined
                  const chartData =
                    skill?.history.map((h) => ({
                      date: formatDate(h.date),
                      score: h.score,
                    })) ?? []

                  return (
                    <TabsContent key={id} value={id}>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(var(--border))"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11 }}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                              domain={[0, 10]}
                              tick={{ fontSize: 11 }}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              name={SKILL_META[id].label}
                              stroke={CHART_COLORS[i]}
                              strokeWidth={2.5}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          No data for {SKILL_META[id].label} yet.
                        </p>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Detailed skill breakdown */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Skill Breakdown</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SKILL_IDS.map((id) => {
                const skill = skills[id] as SkillProgress | undefined
                const meta = SKILL_META[id]

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * SKILL_IDS.indexOf(id) }}
                  >
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{meta.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {meta.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold tabular-nums">
                            {(skill?.currentScore ?? 0).toFixed(1)}/10
                          </span>
                          <TrendIcon trend={skill?.trend ?? "stable"} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Session history table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No completed sessions yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Scenario</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium text-right">Score</th>
                        <th className="pb-2 font-medium">Skills Improved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentSessions.map((s) => (
                        <tr key={s.id} className="group">
                          <td className="py-2.5">
                            <div className="flex flex-col items-start gap-1">
                              <Link
                                href={`/practice/${s.id}/score`}
                                className="font-medium transition-colors hover:text-pink-600"
                              >
                                {s.scenario_title}
                              </Link>
                              <Link
                                href={`/practice/${s.id}/review`}
                                className="text-xs text-primary hover:underline"
                              >
                                Review
                              </Link>
                            </div>
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3" />
                              {formatDate(s.completed_at)}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Badge
                              variant={
                                s.overall_score >= 7
                                  ? "default"
                                  : s.overall_score >= 5
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {s.overall_score.toFixed(1)}/10
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            {s.skills_improved.length > 0 ? (
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                {s.skills_improved
                                  .map(
                                    (sk) =>
                                      SKILL_META[sk as SkillId]?.label ?? sk
                                  )
                                  .join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
