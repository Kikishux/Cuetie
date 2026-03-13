export interface HumeEmotionScore {
  name: string;
  score: number;
}

export interface HumeEmotionResult {
  topEmotions: HumeEmotionScore[];
  dominantEmotion: string;
  emotionValence: "positive" | "negative" | "neutral";
  rawScores: Record<string, number>;
  analysisId?: string;
}

export type HumeAnalysisStatus = "available" | "limit_reached" | "not_eligible" | "error";

export interface HumeAnalysisResponse {
  status: HumeAnalysisStatus;
  result?: HumeEmotionResult;
  remainingAnalyses?: number;
  error?: string;
}

export const POSITIVE_EMOTIONS = [
  "Joy",
  "Amusement",
  "Interest",
  "Excitement",
  "Admiration",
  "Contentment",
  "Love",
  "Gratitude",
  "Pride",
  "Relief",
  "Satisfaction",
  "Desire",
  "Ecstasy",
  "Triumph",
] as const;

export const NEGATIVE_EMOTIONS = [
  "Anger",
  "Anxiety",
  "Contempt",
  "Disgust",
  "Distress",
  "Fear",
  "Guilt",
  "Horror",
  "Pain",
  "Sadness",
  "Shame",
] as const;

const positiveEmotions = new Set<string>(POSITIVE_EMOTIONS);
const negativeEmotions = new Set<string>(NEGATIVE_EMOTIONS);

export function classifyEmotionValence(
  emotion: string,
): "positive" | "negative" | "neutral" {
  if (positiveEmotions.has(emotion)) return "positive";
  if (negativeEmotions.has(emotion)) return "negative";
  return "neutral";
}
