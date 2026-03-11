"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import ScenarioCard from "@/components/chat/ScenarioCard";
import type { Scenario, DifficultyLevel } from "@/lib/types/database";

const difficultyFilters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
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
        body: JSON.stringify({ scenarioId }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      router.push(`/practice/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setStarting(null);
    }
  };

  const filtered =
    filter === "all"
      ? scenarios
      : scenarios.filter((s) => s.difficulty === (filter as DifficultyLevel));

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

      {/* Difficulty filter tabs */}
      <Tabs
        defaultValue={0}
        onValueChange={(val) => {
          const index = typeof val === "number" ? val : Number(val);
          setFilter(difficultyFilters[index]?.value ?? "all");
        }}
      >
        <TabsList>
          {difficultyFilters.map((f, i) => (
            <TabsTrigger key={f.value} value={i}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
          No scenarios found for this difficulty level.
        </div>
      )}
    </div>
  );
}
