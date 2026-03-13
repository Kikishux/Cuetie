"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ErrorResponse } from "@/lib/types/api";
import type { DebriefRequest, DebriefResponse } from "@/lib/types/coach";
import { ArrowRight, ChevronDown, Loader2, Sparkles } from "lucide-react";

function DebriefSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="animate-pulse border-primary/10">
        <CardHeader>
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse border-primary/10">
            <CardHeader>
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-11/12 rounded bg-muted" />
              <div className="h-4 w-4/5 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  className,
  emptyText,
}: {
  title: string;
  items: string[];
  className: string;
  emptyText: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/85">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3">
              <span className="mt-1 text-xs">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export default function DebriefPage() {
  const [whatHappened, setWhatHappened] = useState("");
  const [howDidYouFeel, setHowDidYouFeel] = useState("");
  const [specificMoment, setSpecificMoment] = useState("");
  const [whatWasHard, setWhatWasHard] = useState("");
  const [analysis, setAnalysis] = useState<DebriefResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = whatHappened.trim().length > 0 && !isLoading;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedWhatHappened = whatHappened.trim();
    if (!trimmedWhatHappened) {
      return;
    }

    setError(null);
    setAnalysis(null);
    setIsLoading(true);

    try {
      const payload: DebriefRequest = {
        what_happened: trimmedWhatHappened,
        ...(howDidYouFeel.trim()
          ? { how_did_you_feel: howDidYouFeel.trim() }
          : {}),
        ...(specificMoment.trim()
          ? { specific_moment: specificMoment.trim() }
          : {}),
        ...(whatWasHard.trim() ? { what_was_hard: whatWasHard.trim() } : {}),
      };

      const response = await fetch("/api/coach/debrief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | DebriefResponse
        | ErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          typeof data === "object" && data !== null && "error" in data
            ? data.error.message
            : "We couldn't debrief that date right now. Please try again."
        );
      }

      if (!data || typeof data !== "object" || !("summary" in data)) {
        throw new Error("We received an unexpected response. Please try again.");
      }

      setAnalysis(data as DebriefResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't debrief that date right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          💭 Post-Date Debrief
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Process what happened and get personalized coaching.
        </p>
      </div>

      <Card className="border-primary/15 bg-primary/[0.02] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Let&apos;s talk about your date</CardTitle>
          <CardDescription>
            You can be as detailed or as simple as you want. We&apos;ll help you sort
            through what happened with warmth, clarity, and concrete next steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="what_happened">📝 What happened on your date?</Label>
              <Textarea
                id="what_happened"
                value={whatHappened}
                onChange={(event) => setWhatHappened(event.target.value)}
                placeholder="We met at a coffee shop. They were late but apologized. The conversation started slow but we eventually found common ground talking about..."
                className="min-h-40 resize-y border-primary/10 bg-background/90"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_did_you_feel">
                💭 How did you feel during and after?
              </Label>
              <Textarea
                id="how_did_you_feel"
                value={howDidYouFeel}
                onChange={(event) => setHowDidYouFeel(event.target.value)}
                placeholder="I felt nervous at first but relaxed after a while..."
                className="min-h-24 resize-y border-primary/10 bg-background/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specific_moment">
                🔍 Was there a specific moment that felt tricky?
              </Label>
              <Textarea
                id="specific_moment"
                value={specificMoment}
                onChange={(event) => setSpecificMoment(event.target.value)}
                placeholder="When they made a joke I wasn't sure if they were being sarcastic..."
                className="min-h-24 resize-y border-primary/10 bg-background/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_was_hard">😤 What felt hardest?</Label>
              <Textarea
                id="what_was_hard"
                value={whatWasHard}
                onChange={(event) => setWhatWasHard(event.target.value)}
                placeholder="Knowing when to make eye contact and when to look away..."
                className="min-h-24 resize-y border-primary/10 bg-background/90"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!canAnalyze} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting Coaching...
                  </>
                ) : analysis ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Coaching Again
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Coaching
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                We&apos;ll focus on what felt meaningful, what felt hard, and what to
                practice next.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <DebriefSkeleton />
      ) : analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📝 Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-foreground/90">{analysis.summary}</p>
            </CardContent>
          </Card>

          <ListCard
            title="✅ What went well"
            items={analysis.went_well}
            className="border-emerald-200 bg-emerald-50"
            emptyText="We didn't catch any clear wins here, but that doesn't mean your effort didn't matter."
          />

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">🔍 Challenging moments</h2>
              <p className="text-sm text-muted-foreground">
                Open each moment for a clear breakdown and a concrete next-step tip.
              </p>
            </div>

            <div className="space-y-3">
              {analysis.challenging_moments.map((moment, index) => (
                <details
                  key={`${moment.moment}-${index}`}
                  className="group overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Moment {index + 1}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {moment.moment}
                      </p>
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="space-y-4 text-sm leading-6 text-foreground/85">
                      <div>
                        <p className="font-medium text-foreground">Decoded</p>
                        <p className="mt-1">{moment.decoded}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tip</p>
                        <p className="mt-1">{moment.tip}</p>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <ListCard
            title="🔄 Patterns noticed"
            items={analysis.patterns_noticed}
            className="border-amber-200 bg-amber-50"
            emptyText="Nothing obvious is repeating yet. A few more debriefs may make patterns easier to spot."
          />

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">🎯 Recommended practice</h2>
              <p className="text-sm text-muted-foreground">
                These Cuetie scenarios are a good next step based on what felt most challenging.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {analysis.suggested_scenarios.map((scenario, index) => (
                <Card key={`${scenario.title}-${index}`} className="h-full border-primary/15">
                  <CardHeader>
                    <CardTitle className="text-base">{scenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-foreground/85">
                      {scenario.why}
                    </p>
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Start Practicing
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardHeader>
              <CardTitle className="text-lg">💪 Encouragement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-foreground/90">
                {analysis.overall_encouragement}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}
