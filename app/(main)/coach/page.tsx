"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  CoachAnalysisResponse,
} from "@/lib/types/coach";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";

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
          <div className="h-4 w-3/4 rounded bg-muted" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-7 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SignalList({
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
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="font-medium">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-1 text-xs">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-foreground/80">{emptyText}</p>
      )}
    </div>
  );
}

export default function CoachPage() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [analysis, setAnalysis] = useState<CoachAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const canAnalyze = message.trim().length > 0 && !isLoading;

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setError(null);
    setCopiedIndex(null);
    setIsLoading(true);

    try {
      const payload: CoachAnalysisRequest = {
        message: trimmedMessage,
        ...(context.trim() ? { context: context.trim() } : {}),
      };

      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | CoachAnalysisResponse
        | ErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          typeof data === "object" && data !== null && "error" in data
            ? data.error.message
            : "We couldn't analyze that message right now. Please try again."
        );
      }

      if (!data || typeof data !== "object" || !("decoded_meaning" in data)) {
        throw new Error("We received an unexpected response. Please try again.");
      }

      setAnalysis(data as CoachAnalysisResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't analyze that message right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedIndex(null);
      }, 1800);
    } catch {
      setError("Copy didn't work this time. You can still highlight and copy the reply.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">💬 Message Coach</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Paste a message you received and get coaching on what it means and how
          to respond.
        </p>
      </div>

      <Card className="border-primary/15 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg">Let&apos;s look at it together</CardTitle>
          <CardDescription>
            Share the message exactly as you received it. If there&apos;s a little
            backstory that would help, you can add that too.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleAnalyze}>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Paste the message you received..."
                className="min-h-40 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Tell me about the situation (optional)</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="We matched on Hinge 3 days ago, been texting casually"
                className="min-h-24 resize-y"
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
                    Analyzing...
                  </>
                ) : analysis ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Again
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Message
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                You can edit the message and re-run the coach anytime.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <AnalysisSkeleton />
      ) : analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔍 What this means</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-foreground/90">
                {analysis.decoded_meaning}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📡 Social cues</CardTitle>
              <CardDescription>
                Here are the concrete signals showing up in the message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.social_cues.map((cue, index) => (
                  <li key={`cue-${index}`} className="flex gap-3">
                    <span className="mt-1 text-sm">•</span>
                    <span className="text-sm leading-6 text-foreground/90">
                      {cue}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚦 Signals</CardTitle>
              <CardDescription>
                A quick read on what feels encouraging, neutral, or worth noticing.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <SignalList
                title="Green flags"
                items={analysis.flags.green}
                className="bg-green-50 border-green-200"
                emptyText="No strong green flags stood out here yet."
              />
              <SignalList
                title="Yellow flags"
                items={analysis.flags.yellow}
                className="bg-amber-50 border-amber-200"
                emptyText="Nothing in particular feels uncertain here."
              />
              {analysis.flags.red.length > 0 && (
                <div className="md:col-span-2">
                  <SignalList
                    title="Red flags"
                    items={analysis.flags.red}
                    className="bg-red-50 border-red-200"
                    emptyText=""
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {analysis.suggested_replies.length > 0 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">💬 Suggested replies</h2>
                <p className="text-sm text-muted-foreground">
                  Pick the one that feels most natural in your voice.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {analysis.suggested_replies.slice(0, 3).map((reply, index) => (
                  <Card key={`${reply.tone}-${index}`} className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="capitalize">
                          {reply.tone}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {analysis.tone}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-6">
                        “{reply.text}”
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Why this works
                        </p>
                        <p className="mt-1 text-sm leading-6 text-foreground/85">
                          {reply.why}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCopy(reply.text, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy reply
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardHeader>
              <CardTitle className="text-lg">💡 Coaching tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-foreground/90">
                {analysis.coaching_tip}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}
