"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Lightbulb, Target, ArrowRight } from "lucide-react";
import type { CoachingData, SkillId } from "@/lib/types/database";

interface CoachingCardProps {
  coaching: CoachingData;
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

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

function CollapsibleSection({
  icon,
  title,
  children,
  defaultOpen = true,
  accentColor = "text-primary",
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 py-1.5 text-left transition-colors hover:text-foreground"
      >
        <span className={cn("shrink-0", accentColor)}>{icon}</span>
        <span className="flex-1 text-sm font-medium">{title}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-1 pl-6 text-sm text-muted-foreground leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CoachingCard({ coaching }: CoachingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardContent className="space-y-1 pt-1">
          {/* Social Cue Decoded */}
          <CollapsibleSection
            icon={<Search className="h-4 w-4" />}
            title="Social Cue Decoded"
            accentColor="text-blue-500"
          >
            {coaching.cue_decoded}
          </CollapsibleSection>

          <Separator className="my-1" />

          {/* Suggestion */}
          <CollapsibleSection
            icon={<Lightbulb className="h-4 w-4" />}
            title="Suggestion"
            accentColor="text-amber-500"
          >
            {coaching.suggestion}
          </CollapsibleSection>

          <Separator className="my-1" />

          {/* Tone Analysis */}
          <CollapsibleSection
            icon={<Target className="h-4 w-4" />}
            title="Tone Analysis"
            accentColor="text-emerald-500"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] font-normal">
                  Your tone: {coaching.tone_analysis.user_tone}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  Ideal: {coaching.tone_analysis.ideal_tone}
                </Badge>
              </div>
              {coaching.tone_analysis.rewrite && (
                <div className="rounded-lg bg-muted/60 p-2.5 text-xs italic">
                  <span className="not-italic font-medium text-foreground">
                    Try:&nbsp;
                  </span>
                  &ldquo;{coaching.tone_analysis.rewrite}&rdquo;
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Skill Tags */}
          {coaching.skill_tags.length > 0 && (
            <>
              <Separator className="my-1" />
              <div className="flex flex-wrap gap-1 pt-1">
                {coaching.skill_tags.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-[10px] font-normal"
                  >
                    {skillLabels[skill] ?? skill}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
