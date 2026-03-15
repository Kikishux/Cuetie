"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Trophy,
  CheckCircle2,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Zap,
  RotateCcw,
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { Scorecard, Scenario, FineTuneRecommendation, SkillId } from "@/lib/types/database";
import { SKILL_LABELS } from "@/lib/types/database";

interface SessionScorecardProps {
  scorecard: Scorecard;
  onNewSession: () => void;
  onGoToDashboard: () => void;
  reviewHref?: string;
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 7
      ? "text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
      : score >= 5
        ? "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
        : "text-destructive border-destructive/20 bg-destructive/5 dark:bg-destructive/10 dark:border-destructive/30";

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className={cn(
        "relative flex h-28 w-28 items-center justify-center rounded-full border-4",
        color
      )}
    >
      <div className="text-center">
        <span className="text-3xl font-bold tabular-nums">
          {score.toFixed(1)}
        </span>
        <span className="block text-xs font-medium opacity-70">/10</span>
      </div>
    </motion.div>
  );
}

const trendIcons = {
  up: <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />,
  down: <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />,
  stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
  new: <Sparkles className="h-3.5 w-3.5 text-blue-500" />,
};

export default function SessionScorecard({
  scorecard,
  onNewSession,
  onGoToDashboard,
  reviewHref,
}: SessionScorecardProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(
    scorecard.suggested_scenarios.length > 0
  );
  const [startingIdx, setStartingIdx] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const skillEntries = Object.entries(scorecard.skills);
  const suggestionsKey = JSON.stringify(scorecard.suggested_scenarios);

  // Start a session — either with a matched scenario or a generated Fine-Tune one
  const startSession = useCallback(async (
    idx: number,
    opts: { scenarioId?: string; title: string; skillFocus: string[]; why?: string; practiceGoal?: string }
  ) => {
    if (startingIdx !== null) return;
    setStartingIdx(idx);
    setStartError(null);
    try {
      if (opts.scenarioId) {
        // Matched scenario → start session directly
        const res = await fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: opts.scenarioId,
            mode: "text",
            roundType: "quick",
          }),
        });
        if (!res.ok) throw new Error("Failed to start session");
        const data = await res.json();
        window.location.href = `/practice/${data.session.id}?round=quick`;
      } else {
        // No match → generate dynamic micro-scenario via AI with session context
        const contextParts: string[] = [];
        if (opts.why) contextParts.push(`Reason: ${opts.why}`);
        if (opts.practiceGoal) contextParts.push(`Goal: ${opts.practiceGoal}`);
        if (scorecard.growth_areas?.length > 0) {
          contextParts.push(`Growth areas: ${scorecard.growth_areas.join("; ")}`);
        }

        const genRes = await fetch("/api/scenarios/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: opts.title,
            skill_focus: opts.skillFocus.length > 0 ? opts.skillFocus : ["question_quality"],
            difficulty: "beginner",
            context: contextParts.length > 0 ? contextParts.join(". ") : undefined,
          }),
        });
        if (!genRes.ok) throw new Error("Failed to generate scenario");
        const scenario = await genRes.json();

        const startRes = await fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: scenario.id ?? "generated",
            mode: "text",
            roundType: "quick",
            generatedScenario: scenario,
            isFinetune: true,
          }),
        });
        if (!startRes.ok) throw new Error("Failed to start Fine-Tune session");
        const data = await startRes.json();
        window.location.href = `/practice/${data.session.id}?round=quick`;
      }
    } catch {
      setStartingIdx(null);
      setStartError("Something went wrong. Please try again.");
    }
  }, [startingIdx, scorecard.growth_areas]);

  useEffect(() => {
    if (scorecard.suggested_scenarios.length === 0) {
      setScenarios([]);
      setLoadingSuggestions(false);
      return;
    }

    let isMounted = true;
    setLoadingSuggestions(true);

    async function fetchScenarios() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) {
          throw new Error("Failed to load scenarios");
        }

        const data = await res.json();
        if (isMounted) {
          setScenarios(data.scenarios ?? data ?? []);
        }
      } catch {
        if (isMounted) {
          setScenarios([]);
        }
      } finally {
        if (isMounted) {
          setLoadingSuggestions(false);
        }
      }
    }

    fetchScenarios();

    return () => {
      isMounted = false;
    };
  }, [suggestionsKey, scorecard.suggested_scenarios.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Celebration header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold">Session Complete!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scorecard.message_count} messages ·{" "}
            {scorecard.session_duration_minutes} min
          </p>
        </div>
        <ScoreCircle score={scorecard.overall_score} />
      </div>

      {/* Skill scores grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Skill Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {skillEntries.map(([skillId, data], i) => (
              <motion.div
                key={skillId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="space-y-1"
              >
                <Progress value={data.score * 10} max={100}>
                  <ProgressLabel className="text-xs flex items-center gap-1">
                    {trendIcons[data.trend]}
                    {skillId
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </ProgressLabel>
                  <ProgressValue className="text-xs">
                    {() => data.score.toFixed(1)}
                  </ProgressValue>
                </Progress>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      {scorecard.highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {scorecard.highlights.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Growth Areas */}
      {scorecard.growth_areas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
              <Target className="h-4 w-4" />
              Growth Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {scorecard.growth_areas.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {scorecard.suggested_scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 Practice Next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {startError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {startError}
              </p>
            )}
            {loadingSuggestions ? (
              <p className="text-sm text-muted-foreground">
                Finding matching scenarios...
              </p>
            ) : (
              <div className="space-y-2">
                {scorecard.suggested_scenarios.map((item, i) => {
                  const isStructured = typeof item === "object" && item !== null && "title" in item;
                  const rec = isStructured ? (item as FineTuneRecommendation) : null;
                  const title = rec ? rec.title : String(item);
                  const matchedId = rec?.matched_scenario_id;
                  const skillFocus = rec?.skill_focus ?? [];
                  const why = rec?.why;
                  const practiceGoal = rec?.practice_goal;
                  const skillLabels = skillFocus
                    .map(s => SKILL_LABELS[s as SkillId] ?? s.replace(/_/g, " "))
                    .join(", ");

                  // Only match by explicit matched_scenario_id — no fuzzy title matching
                  const matched = matchedId
                    ? scenarios.find(s => s.id === matchedId)
                    : null;

                  const isLoading = startingIdx === i;
                  const isDisabled = startingIdx !== null;

                  if (matched) {
                    // Matched to existing scenario → button that starts a session directly
                    return (
                      <motion.div
                        key={`match-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.08 }}
                      >
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => startSession(i, { scenarioId: matched.id, title: matched.title, skillFocus, why, practiceGoal })}
                          className="group flex w-full items-start justify-between gap-3 rounded-xl border bg-muted/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-6">
                              {matched.title}
                            </p>
                            {why && (
                              <p className="mt-1 text-xs text-muted-foreground/80 italic">
                                💡 {why}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {matched.difficulty} · {matched.category.replace(/_/g, " ")}
                              {practiceGoal && ` · Goal: ${practiceGoal}`}
                            </p>
                          </div>
                          {isLoading ? (
                            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                          ) : (
                            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          )}
                        </button>
                      </motion.div>
                    );
                  }

                  // No match → Fine-Tune Skills: generate dynamic micro-scenario
                  return (
                    <motion.div
                      key={`ft-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                    >
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => startSession(i, { title, skillFocus, why, practiceGoal })}
                        className="group flex w-full items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <p className="text-sm font-semibold leading-6">{title}</p>
                          </div>
                          {why && (
                            <p className="mt-1 text-xs text-muted-foreground/80 italic">
                              💡 {why}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isLoading
                              ? "Generating scenario..."
                              : `Fine-Tune Skills · Quick · 5 min${skillLabels ? ` · ${skillLabels}` : ""}`}
                          </p>
                          {practiceGoal && !isLoading && (
                            <p className="mt-0.5 text-xs text-primary/70">
                              🎯 {practiceGoal}
                            </p>
                          )}
                        </div>
                        {isLoading ? (
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={onNewSession} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Practice Again
        </Button>
        {reviewHref && (
          <Link
            href={reviewHref}
            className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}
          >
            <MessageSquare className="h-4 w-4" />
            Review Conversation
          </Link>
        )}
        <Button variant="outline" onClick={onGoToDashboard} className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
