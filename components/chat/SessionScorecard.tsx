"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RotateCcw,
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import type { Scorecard } from "@/lib/types/database";

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
  const skillEntries = Object.entries(scorecard.skills);

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

      {/* Suggested Scenarios */}
      {scorecard.suggested_scenarios.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested Next
          </h3>
          <div className="flex flex-wrap gap-2">
            {scorecard.suggested_scenarios.map((scenario) => (
              <Badge key={scenario} variant="outline" className="text-xs">
                {scenario}
              </Badge>
            ))}
          </div>
        </div>
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
