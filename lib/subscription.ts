import type { User } from "@/lib/types/database"

export const HUME_FREE_PREVIEW_LIMIT = 3

export function isPremium(user: Pick<User, "subscription_tier">): boolean {
  return user.subscription_tier === "premium"
}

export function canUseHume(
  user: Pick<User, "subscription_tier">,
  sessionVoiceMessageCount: number,
): boolean {
  if (isPremium(user)) return true
  return sessionVoiceMessageCount < HUME_FREE_PREVIEW_LIMIT
}

export function getRemainingHumeAnalyses(
  user: Pick<User, "subscription_tier">,
  sessionVoiceMessageCount: number,
): number {
  if (isPremium(user)) return Infinity
  return Math.max(0, HUME_FREE_PREVIEW_LIMIT - sessionVoiceMessageCount)
}

export function getHumeAnalysisStatus(
  user: Pick<User, "subscription_tier">,
  sessionVoiceMessageCount: number,
): "available" | "limit_reached" {
  return canUseHume(user, sessionVoiceMessageCount) ? "available" : "limit_reached"
}
