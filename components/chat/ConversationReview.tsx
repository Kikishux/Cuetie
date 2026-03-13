"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  Mic,
  Search,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CoachingData, Message, SessionMode, SkillId } from "@/lib/types/database";

interface ConversationReviewProps {
  messages: Message[];
  sessionMode: SessionMode;
  partnerName?: string;
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

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatSignalScore(value: number): string {
  if (Number.isNaN(value)) return "—";
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function CoachingDetails({ coaching }: { coaching: CoachingData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-orange-50/60 shadow-sm dark:to-orange-950/10">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            <Sparkles className="h-3.5 w-3.5" />
            Coaching Notes
          </div>

          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Search className="h-3.5 w-3.5 text-blue-500" />
              Social Cue
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {coaching.cue_decoded}
            </p>
          </section>

          <Separator />

          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Coach Tip
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {coaching.suggestion}
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Target className="h-3.5 w-3.5 text-emerald-500" />
              Tone Analysis
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Your tone
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {coaching.tone_analysis.user_tone}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/70 dark:bg-emerald-950/20">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Ideal tone
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  {coaching.tone_analysis.ideal_tone}
                </p>
              </div>
            </div>
            {coaching.tone_analysis.rewrite && (
              <div className="rounded-xl bg-muted/70 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Try saying:</span>{" "}
                &ldquo;{coaching.tone_analysis.rewrite}&rdquo;
              </div>
            )}
          </section>

          {coaching.skill_tags.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Focus Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {coaching.skill_tags.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded-full bg-primary/10 text-[10px] font-medium text-primary hover:bg-primary/10"
                    >
                      {skillLabels[skill] ?? skill}
                    </Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {coaching.voice_tone && (
            <>
              <Separator />
              <section className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-fuchsia-500" />
                  Voice Tone
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Emotion
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {coaching.voice_tone.detected_emotion}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Confidence
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatSignalScore(coaching.voice_tone.confidence_level)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Expressiveness
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatSignalScore(coaching.voice_tone.expressiveness)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-fuchsia-200/70 bg-fuchsia-50/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground dark:border-fuchsia-900/70 dark:bg-fuchsia-950/20">
                  <p>
                    <span className="font-medium text-foreground">Energy match:</span>{" "}
                    {coaching.voice_tone.energy_match}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-foreground">Voice suggestion:</span>{" "}
                    {coaching.voice_tone.suggestion}
                  </p>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ConversationReview({
  messages,
  sessionMode,
  partnerName = "Partner",
}: ConversationReviewProps) {
  if (messages.length === 0) {
    return (
      <Card className="border-dashed border-primary/20 bg-card/70">
        <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 p-6 text-center">
          <Sparkles className="h-6 w-6 text-primary/70" />
          <p className="font-medium text-foreground">No conversation saved yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Complete a practice session to replay the full chat with coaching notes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {messages.map((message, index) => {
        if (message.role === "system") {
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
              className="flex justify-center"
            >
              <div className="max-w-2xl rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-center text-xs text-muted-foreground">
                {message.content}
              </div>
            </motion.div>
          );
        }

        const isUser = message.role === "user";
        const hasCoaching = message.role === "partner" && Boolean(message.coaching);

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
            className="space-y-3"
          >
            <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
              {!isUser && (
                <Avatar size="sm" className="mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {partnerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn("flex max-w-[85%] flex-col gap-1.5", isUser && "items-end")}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-1 text-[11px] text-muted-foreground",
                    isUser && "justify-end"
                  )}
                >
                  <span className="font-medium text-foreground/80">
                    {isUser ? "You" : partnerName}
                  </span>
                  {isUser && sessionMode === "voice" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <span aria-hidden="true">🎤</span>
                      Voice
                    </span>
                  )}
                  <span>{formatTime(message.created_at)}</span>
                </div>

                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-primary/10 bg-card text-foreground"
                  )}
                >
                  {isUser && sessionMode === "voice" && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground/80">
                      <Mic className="h-3 w-3" />
                      Spoken reply
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>

            {hasCoaching && message.coaching && (
              <div className="pl-0 sm:pl-12">
                <CoachingDetails coaching={message.coaching} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default ConversationReview;
