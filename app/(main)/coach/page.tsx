"use client";

import { useEffect, useRef, useState } from "react";
import { SafeMotion } from "@/components/shared/SafeMotion";
import { Badge } from "@/components/ui/badge";
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
import type {
  CoachAnalysisRequest,
  AmbiguityAnalysis,
  AmbiguityLevel,
  SupportLevel,
  InteractionStage,
  UserNeed,
} from "@/lib/types/coach";
import {
  Check,
  Copy,
  Loader2,
  Sparkles,
  MessageCircleQuestion,
  Search,
  Quote,
} from "lucide-react";

/* ───────────────── option data ───────────────── */

const stageOptions: { value: InteractionStage; label: string }[] = [
  { value: "just-matched", label: "Just matched" },
  { value: "early-texting", label: "Early texting" },
  { value: "after-first-date", label: "After first date" },
  { value: "ongoing-dating", label: "Ongoing dating" },
  { value: "other", label: "Other" },
];

const needOptions: { value: UserNeed; label: string }[] = [
  { value: "understand-meaning", label: "Understand the meaning" },
  { value: "decide-whether-to-reply", label: "Decide whether to reply" },
  { value: "write-a-reply", label: "Help me write a reply" },
  { value: "check-if-should-ask-directly", label: "Should I ask them directly?" },
];

const goalTabs = [
  { key: "warm" as const, label: "Warm", emoji: "💛" },
  { key: "direct" as const, label: "Direct", emoji: "🎯" },
  { key: "clarifying" as const, label: "Clarifying", emoji: "🔍" },
  { key: "boundary" as const, label: "Boundary", emoji: "🛡️" },
];

/* ───────────────── helpers ───────────────── */

function ambiguityColor(level: AmbiguityLevel) {
  switch (level) {
    case "low": return "bg-green-100 text-green-800 border-green-200";
    case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
    case "high": return "bg-red-100 text-red-800 border-red-200";
  }
}

function supportColor(level: SupportLevel) {
  switch (level) {
    case "strong": return "bg-green-50 border-green-200";
    case "some": return "bg-amber-50 border-amber-200";
    case "weak": return "bg-muted border-border";
  }
}

function supportLabel(level: SupportLevel) {
  switch (level) {
    case "strong": return "Strong support";
    case "some": return "Some support";
    case "weak": return "Weak support";
  }
}

/* ───────────────── skeletons ───────────────── */

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-11/12 rounded bg-muted" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="space-y-3 pt-6">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ───────────────── component ───────────────── */

export default function AmbiguityDecoderPage() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [stage, setStage] = useState<InteractionStage | undefined>();
  const [need, setNeed] = useState<UserNeed | undefined>();
  const [analysis, setAnalysis] = useState<AmbiguityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<"warm" | "direct" | "clarifying" | "boundary">("warm");
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const canAnalyze = message.trim().length > 0 && !isLoading;

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setError(null);
    setCopiedKey(null);
    setIsLoading(true);
    setActiveGoal("warm");

    try {
      const payload: CoachAnalysisRequest = {
        message: trimmedMessage,
        ...(context.trim() ? { context: context.trim() } : {}),
        ...(stage ? { interaction_stage: stage } : {}),
        ...(need ? { user_need: need } : {}),
      };

      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | AmbiguityAnalysis
        | ErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          typeof data === "object" && data !== null && "error" in data
            ? data.error.message
            : "We couldn't decode that message right now. Please try again."
        );
      }

      if (!data || typeof data !== "object" || !("best_read" in data)) {
        throw new Error("We received an unexpected response. Please try again.");
      }

      const result = data as AmbiguityAnalysis;
      setAnalysis(result);

      if (result.ambiguity_level === "high") {
        setActiveGoal("clarifying");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't decode that message right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setError("Copy didn't work this time. You can highlight and copy the text instead.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">🔮 Ambiguity Decoder</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Paste a message you received and find out what it likely means — with
          honest uncertainty, evidence from the actual words, and response options
          organized by what you need.
        </p>
      </div>

      {/* Input form */}
      <Card className="border-primary/15 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg">What did they say?</CardTitle>
          <CardDescription>
            Share the message exactly as you received it. The more context you
            add, the better the analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleAnalyze}>
            <div className="space-y-2">
              <Label htmlFor="message">Their message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the message you received..."
                className="min-h-32 resize-y"
              />
            </div>

            {/* Structured context */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Where are you in this interaction?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {stageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStage(stage === opt.value ? undefined : opt.value)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        stage === opt.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">What do you need most?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {needOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNeed(need === opt.value ? undefined : opt.value)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        need === opt.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Anything else that helps (optional)</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="We matched on Hinge 3 days ago, been texting casually..."
                className="min-h-20 resize-y"
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Decoding...</>
                ) : analysis ? (
                  <><Sparkles className="h-4 w-4" /> Decode Again</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Decode Message</>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Edit and re-run anytime.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <AnalysisSkeleton />
      ) : analysis ? (
        <SafeMotion
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-5"
        >
          {/* 1. Summary card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Best read</CardTitle>
                <Badge className={`text-xs font-medium ${ambiguityColor(analysis.ambiguity_level)}`}>
                  {analysis.ambiguity_level === "low" && "Low ambiguity"}
                  {analysis.ambiguity_level === "medium" && "Medium ambiguity"}
                  {analysis.ambiguity_level === "high" && "High ambiguity"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base leading-7">{analysis.best_read}</p>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm">
                  <span className="font-medium">Best next move:</span>{" "}
                  {analysis.best_next_move}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Literal vs Implied */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📝 Literal meaning</CardTitle>
                <CardDescription>What the words actually say</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6">{analysis.literal_meaning}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">🔮 Possible meanings</CardTitle>
                <CardDescription>Ranked by likelihood</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.interpretations.map((interp, i) => (
                  <div
                    key={`interp-${i}`}
                    className={`rounded-lg border p-3 ${supportColor(interp.support_level)}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{interp.label}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {supportLabel(interp.support_level)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {interp.explanation}
                    </p>
                    {interp.evidence_phrases.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {interp.evidence_phrases.map((phrase, j) => (
                          <span
                            key={`ev-${i}-${j}`}
                            className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-foreground/70 ring-1 ring-border"
                          >
                            <Quote className="h-2.5 w-2.5" />
                            {phrase}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 3. Evidence markers */}
          {analysis.evidence_markers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🔬 Evidence breakdown</CardTitle>
                <CardDescription>
                  Key phrases from the message and what they could mean
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.evidence_markers.map((marker, i) => (
                    <div key={`marker-${i}`} className="rounded-lg border p-3 space-y-2">
                      <p className="text-sm font-medium">"{marker.phrase}"</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-green-700">Could mean:</span>{" "}
                          {marker.could_mean}
                        </p>
                        <p>
                          <span className="font-medium text-amber-700">But also:</span>{" "}
                          {marker.but_also}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Ask Directly callout */}
          {analysis.ambiguity_level !== "low" && analysis.ask_directly_scripts.length > 0 && (
            <Card className={
              analysis.ambiguity_level === "high"
                ? "border-primary/30 bg-primary/[0.04]"
                : "border-border"
            }>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {analysis.ambiguity_level === "high"
                      ? "Too ambiguous to decode confidently — ask directly"
                      : "Consider asking directly"}
                  </CardTitle>
                </div>
                <CardDescription>
                  Direct questions are a strength, not a weakness. These scripts feel natural:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.ask_directly_scripts.map((script, i) => (
                  <div
                    key={`ask-${i}`}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <p className="text-sm italic leading-6">"{script}"</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleCopy(script, `ask-${i}`)}
                    >
                      {copiedKey === `ask-${i}` ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 5. Responses by goal */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">💬 Response options</h2>
              <p className="text-sm text-muted-foreground">
                Choose by what you're trying to accomplish.
              </p>
            </div>

            {/* Goal tabs */}
            <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
              {goalTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveGoal(tab.key)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeGoal === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mr-1">{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Active goal response */}
            {(() => {
              const resp = analysis.responses_by_goal[activeGoal];
              return (
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-base leading-7 italic">"{resp.text}"</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Why this works
                        </p>
                        <p className="mt-1 text-sm leading-6">{resp.why}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Best when
                        </p>
                        <p className="mt-1 text-sm leading-6">{resp.best_when}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopy(resp.text, `goal-${activeGoal}`)}
                    >
                      {copiedKey === `goal-${activeGoal}` ? (
                        <><Check className="h-4 w-4" /> Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copy reply</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* 6. Coaching tip */}
          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardHeader>
              <CardTitle className="text-lg">💡 Coaching tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7">{analysis.coaching_tip}</p>
            </CardContent>
          </Card>
        </SafeMotion>
      ) : null}
    </div>
  );
}
