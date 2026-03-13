"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sparkles, MessageCircle, Mic, Search } from "lucide-react";
import ScenarioCard from "@/components/chat/ScenarioCard";
import type {
  Scenario,
  DifficultyLevel,
  ScenarioCategory,
  SessionMode,
} from "@/lib/types/database";

const difficultyFilters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const categoryOptions: {
  value: "all" | ScenarioCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "All", emoji: "📋" },
  { value: "coffee_date", label: "Coffee Date", emoji: "☕" },
  { value: "first_meeting", label: "First Meeting", emoji: "👋" },
  { value: "dinner_date", label: "Dinner Date", emoji: "🍽️" },
  { value: "texting", label: "Texting", emoji: "📱" },
  { value: "video_call", label: "Video Call", emoji: "📹" },
  { value: "awkward_moments", label: "Awkward", emoji: "😅" },
  { value: "deepening_connection", label: "Deepening", emoji: "💕" },
  { value: "conflict_resolution", label: "Conflict", emoji: "⚡" },
];

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="space-y-3 pt-4">
        <div className="flex justify-between">
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sessionMode, setSessionMode] = useState<SessionMode>("text");

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) throw new Error("Failed to load scenarios");
        const data = await res.json();
        setScenarios(data.scenarios ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, []);

  const handleStart = async (scenarioId: string) => {
    if (starting) return;
    setStarting(scenarioId);
    setError(null);

    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, mode: sessionMode }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      router.push(`/practice/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setStarting(null);
    }
  };

  const filtered = scenarios
    .filter((s) => filter === "all" || s.difficulty === (filter as DifficultyLevel))
    .filter((s) => categoryFilter === "all" || s.category === categoryFilter)
    .filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" />
          Choose a Practice Scenario
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a scenario to practice your conversation skills with an AI
          partner.
        </p>
      </div>

      {/* Mode toggle + filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Session mode toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <button
              onClick={() => setSessionMode("text")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                sessionMode === "text"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Text
            </button>
            <button
              onClick={() => setSessionMode("voice")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                sessionMode === "voice"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              Voice
            </button>
          </div>

          {/* Difficulty filter tabs */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {difficultyFilters.map((difficulty) => (
                <TabsTrigger key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="snap-x overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 pb-1">
            {categoryOptions.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setCategoryFilter(category.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  categoryFilter === category.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span aria-hidden="true">{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scenarios..."
            className="h-10 pl-9"
            aria-label="Search scenarios"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Scenario grid */}
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  starting === scenario.id && "opacity-70 pointer-events-none"
                )}
              >
                <ScenarioCard scenario={scenario} onStart={handleStart} />
              </div>
            ))}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No scenarios match your filters. Try adjusting your search or filters.
        </div>
      )}
    </div>
  );
}
