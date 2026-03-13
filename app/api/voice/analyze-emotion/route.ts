import { NextRequest, NextResponse } from "next/server";
import { HUME_CONFIG, humeClient } from "@/lib/ai/hume-config";
import {
  canUseHume,
  getRemainingHumeAnalyses,
  isPremium,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import type { ErrorResponse } from "@/lib/types/api";
import {
  classifyEmotionValence,
  type HumeAnalysisResponse,
  type HumeEmotionResult,
} from "@/lib/types/hume";

type SubscriptionUser = {
  subscription_tier: "free" | "premium";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeSubscriptionUser(subscriptionTier?: string | null): SubscriptionUser {
  return {
    subscription_tier: subscriptionTier === "premium" ? "premium" : "free",
  };
}

function extractRawEmotionScores(predictions: unknown): Record<string, number> {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();

  if (!Array.isArray(predictions)) {
    return {};
  }

  for (const sourcePrediction of predictions) {
    if (!isRecord(sourcePrediction)) continue;

    const results = sourcePrediction.results;
    if (!isRecord(results) || !Array.isArray(results.predictions)) continue;

    for (const inferencePrediction of results.predictions) {
      if (!isRecord(inferencePrediction)) continue;

      const models = inferencePrediction.models;
      if (!isRecord(models)) continue;

      const prosody = models.prosody;
      if (!isRecord(prosody) || !Array.isArray(prosody.groupedPredictions)) continue;

      for (const groupPrediction of prosody.groupedPredictions) {
        if (!isRecord(groupPrediction) || !Array.isArray(groupPrediction.predictions)) {
          continue;
        }

        for (const segmentPrediction of groupPrediction.predictions) {
          if (!isRecord(segmentPrediction) || !Array.isArray(segmentPrediction.emotions)) {
            continue;
          }

          for (const emotion of segmentPrediction.emotions) {
            if (!isRecord(emotion)) continue;

            const name = emotion.name;
            const score = emotion.score;

            if (typeof name !== "string" || typeof score !== "number") continue;

            totals.set(name, (totals.get(name) ?? 0) + score);
            counts.set(name, (counts.get(name) ?? 0) + 1);
          }
        }
      }
    }
  }

  const rawScores: Record<string, number> = {};

  for (const [name, total] of totals.entries()) {
    rawScores[name] = total / (counts.get(name) ?? 1);
  }

  return rawScores;
}

function buildEmotionResult(
  predictions: unknown,
  analysisId: string,
): HumeEmotionResult | null {
  const rawScores = extractRawEmotionScores(predictions);

  const topEmotions = Object.entries(rawScores)
    .sort(([, leftScore], [, rightScore]) => rightScore - leftScore)
    .slice(0, HUME_CONFIG.topEmotionsCount)
    .map(([name, score]) => ({ name, score }));

  if (topEmotions.length === 0) {
    return null;
  }

  const dominantEmotion = topEmotions[0].name;

  return {
    topEmotions,
    dominantEmotion,
    emotionValence: classifyEmotionValence(dominantEmotion),
    rawScores,
    analysisId,
  };
}

async function runHumeAnalysis(audioFile: File): Promise<HumeEmotionResult | null> {
  if (!humeClient) {
    return null;
  }

  try {
    const job = await humeClient.expressionMeasurement.batch.startInferenceJobFromLocalFile({
      file: [audioFile],
      json: { models: HUME_CONFIG.models },
    });

    await job.awaitCompletion();

    const predictions = await humeClient.expressionMeasurement.batch.getJobPredictions(
      job.jobId,
    );

    return buildEmotionResult(predictions, job.jobId);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // --- Authenticate ---
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    // --- Parse multipart form data ---
    const formData = await request.formData();
    const audioEntry = formData.get("audio");
    const sessionIdEntry = formData.get("sessionId");

    if (!(audioEntry instanceof File) || audioEntry.size === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "Audio file is required" } },
        { status: 400 },
      );
    }

    if (typeof sessionIdEntry !== "string" || !sessionIdEntry.trim()) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "Session ID is required" } },
        { status: 400 },
      );
    }

    const sessionId = sessionIdEntry.trim();

    // --- Verify session ownership ---
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 },
      );
    }

    // --- Load subscription and usage ---
    const { data: userRecord } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single<{ subscription_tier: string }>();

    const subscriptionUser = normalizeSubscriptionUser(userRecord?.subscription_tier);

    const { count: voiceMessageCount, error: countError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "user");

    if (countError) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "DB_ERROR", message: "Failed to check Hume usage limits" } },
        { status: 500 },
      );
    }

    const currentVoiceMessageCount = voiceMessageCount ?? 0;

    if (!canUseHume(subscriptionUser, currentVoiceMessageCount)) {
      return NextResponse.json<HumeAnalysisResponse>({
        status: "limit_reached",
        remainingAnalyses: 0,
      });
    }

    const result = await runHumeAnalysis(audioEntry);

    if (!result) {
      return NextResponse.json<HumeAnalysisResponse>({
        status: "error",
        error: "Emotion analysis unavailable",
      });
    }

    const remainingAnalyses = isPremium(subscriptionUser)
      ? undefined
      : getRemainingHumeAnalyses(subscriptionUser, currentVoiceMessageCount + 1);

    return NextResponse.json<HumeAnalysisResponse>({
      status: "available",
      result,
      ...(remainingAnalyses !== undefined ? { remainingAnalyses } : {}),
    });
  } catch {
    return NextResponse.json<HumeAnalysisResponse>({
      status: "error",
      error: "Emotion analysis unavailable",
    });
  }
}
