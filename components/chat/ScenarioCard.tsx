"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Users, Sparkles } from "lucide-react";
import type { DifficultyLevel, PartnerPersona, Scenario } from "@/lib/types/database";

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenarioId: string) => void;
}

const difficultyConfig: Record<
  DifficultyLevel,
  { label: string; className: string }
> = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  advanced: {
    label: "Advanced",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
  },
};

const categoryLabels: Record<string, string> = {
  first_meeting: "First Meeting",
  coffee_date: "Coffee Date",
  dinner_date: "Dinner Date",
  texting: "Texting",
  video_call: "Video Call",
  awkward_moments: "Awkward Moments",
  deepening_connection: "Deepening Connection",
  conflict_resolution: "Conflict Resolution",
};

const attachmentLabels: Record<NonNullable<PartnerPersona["attachment_style"]>, { emoji: string; label: string }> = {
  secure: { emoji: "💚", label: "Open & Direct" },
  anxious: { emoji: "💛", label: "Seeks Connection" },
  avoidant: { emoji: "🔒", label: "Guarded" },
  "fearful-avoidant": { emoji: "🌊", label: "Hot & Cold" },
};

export default function ScenarioCard({ scenario, onStart }: ScenarioCardProps) {
  const difficulty = difficultyConfig[scenario.difficulty];
  const persona = scenario.partner_persona;
  const attachmentTag = persona.attachment_style ? attachmentLabels[persona.attachment_style] : null;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:ring-2 hover:ring-primary/30 hover:shadow-lg hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-md"
      )}
      onClick={() => onStart(scenario.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart(scenario.id);
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-snug">{scenario.title}</CardTitle>
          <Badge
            className={cn(
              "shrink-0 border-0 text-[11px] font-semibold",
              difficulty.className
            )}
          >
            {difficulty.label}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {scenario.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Partner Persona */}
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {persona.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{persona.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {persona.occupation}
            </p>
            {attachmentTag && (
              <Badge variant="secondary" className="mt-1 gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                <span aria-hidden="true">{attachmentTag.emoji}</span>
                {attachmentTag.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Category + Coaching Focus */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[11px]">
            <Users className="mr-1 h-3 w-3" />
            {categoryLabels[scenario.category] ?? scenario.category}
          </Badge>
          {scenario.coaching_focus.slice(0, 3).map((focus) => (
            <Badge
              key={focus}
              variant="secondary"
              className="text-[11px] font-normal"
            >
              <Sparkles className="mr-0.5 h-2.5 w-2.5" />
              {focus}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
