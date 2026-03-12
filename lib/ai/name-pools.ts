import type { DatingPreference } from "@/lib/types/database";

const FEMALE_NAMES = [
  "Sarah", "Maya", "Priya", "Elena", "Aisha",
  "Sophia", "Luna", "Nadia", "Mei", "Camila",
];

const MALE_NAMES = [
  "Marcus", "Kai", "Ravi", "Daniel", "Omar",
  "Ethan", "Leo", "Andre", "Hiroshi", "Carlos",
];

const NONBINARY_NAMES = [
  "Sage", "River", "Ash", "Rowan", "Indigo",
  "Quinn", "Wren", "Finley", "Sky", "Jade",
];

const NAME_POOLS: Record<string, string[]> = {
  female: FEMALE_NAMES,
  male: MALE_NAMES,
  "non-binary": NONBINARY_NAMES,
  genderqueer: NONBINARY_NAMES,
};

/**
 * Returns a gender-appropriate partner name based on the user's dating preference.
 * Uses scenarioIndex for deterministic selection so the same scenario always
 * gets the same name for a given preference.
 *
 * Returns null if no swap is needed (no-preference or unset).
 */
export function getPartnerName(
  datingPreference: DatingPreference | undefined,
  scenarioIndex: number
): string | null {
  if (!datingPreference || datingPreference === "no-preference") {
    return null;
  }

  const pool = NAME_POOLS[datingPreference];
  if (!pool) return null;

  return pool[Math.abs(scenarioIndex) % pool.length];
}
