import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse, RecommendedScenariosResponse } from "@/lib/types/api";
import type { Scenario, SkillId } from "@/lib/types/database";

const SKILL_LABELS: Record<SkillId, string> = {
  empathy: "Empathy",
  question_quality: "Question Quality",
  topic_flow: "Topic Flow",
  cue_detection: "Cue Detection",
  tone_matching: "Tone Matching",
  conversation_pacing: "Conversation Pacing",
  self_disclosure: "Self-Disclosure",
  active_listening: "Active Listening",
};

type LatestSkillScore = {
  skill_id: SkillId;
  score: number;
  measured_at: string;
};

function getLatestSkillScores(scores: LatestSkillScore[]): LatestSkillScore[] {
  const latestBySkill = new Map<SkillId, LatestSkillScore>();

  for (const score of scores) {
    if (!latestBySkill.has(score.skill_id)) {
      latestBySkill.set(score.skill_id, score);
    }
  }

  return Array.from(latestBySkill.values());
}

function getScenarioRelevance(
  scenario: Scenario,
  weakSkillScores: Map<SkillId, number>
) {
  return scenario.coaching_focus.reduce((total, focus) => {
    const userScore = weakSkillScores.get(focus as SkillId);
    if (userScore === undefined) {
      return total;
    }

    return total + (10 - userScore);
  }, 0);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const [scoresResult, scenariosResult, recentSessionsResult] = await Promise.all([
      supabase
        .from("skill_scores")
        .select("skill_id, score, measured_at")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })
        .returns<LatestSkillScore[]>(),
      supabase
        .from("scenarios")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<Scenario[]>(),
      supabase
        .from("sessions")
        .select("scenario_id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .limit(3)
        .returns<{ scenario_id: string }[]>(),
    ]);

    if (scoresResult.error || scenariosResult.error || recentSessionsResult.error) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "DB_ERROR",
            message: "Failed to build scenario recommendations",
          },
        },
        { status: 500 }
      );
    }

    const latestScores = getLatestSkillScores(scoresResult.data ?? []);
    if (latestScores.length === 0) {
      return NextResponse.json<RecommendedScenariosResponse>({
        recommended: [],
        weakSkills: [],
      });
    }

    const weakSkills = latestScores
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }

        return SKILL_LABELS[a.skill_id].localeCompare(SKILL_LABELS[b.skill_id]);
      })
      .slice(0, 3)
      .map((skill) => ({
        id: skill.skill_id,
        score: skill.score,
        label: SKILL_LABELS[skill.skill_id],
      }));

    const weakSkillScores = new Map(weakSkills.map((skill) => [skill.id, skill.score]));
    const recentlyPracticed = new Set(
      (recentSessionsResult.data ?? []).map((session) => session.scenario_id)
    );

    const recommended = (scenariosResult.data ?? [])
      .filter((scenario) => !recentlyPracticed.has(scenario.id))
      .map((scenario) => ({
        scenario,
        relevanceScore: getScenarioRelevance(scenario, weakSkillScores),
      }))
      .filter(({ relevanceScore }) => relevanceScore > 0)
      .sort(
        (a, b) =>
          b.relevanceScore - a.relevanceScore ||
          a.scenario.sort_order - b.scenario.sort_order
      )
      .slice(0, 5)
      .map(({ scenario }) => scenario);

    return NextResponse.json<RecommendedScenariosResponse>({
      recommended,
      weakSkills,
    });
  } catch {
    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
