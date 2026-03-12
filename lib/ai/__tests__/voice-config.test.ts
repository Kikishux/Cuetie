import { describe, it, expect } from "vitest";
import { getVoiceForPreference } from "@/lib/ai/config";

describe("getVoiceForPreference", () => {
  it("returns 'alloy' as default when no preference", () => {
    expect(getVoiceForPreference(undefined)).toBe("alloy");
  });

  it("returns 'echo' for male preference", () => {
    expect(getVoiceForPreference("male")).toBe("echo");
  });

  it("returns 'nova' for female preference", () => {
    expect(getVoiceForPreference("female")).toBe("nova");
  });

  it("returns 'alloy' for non-binary preference", () => {
    expect(getVoiceForPreference("non-binary")).toBe("alloy");
  });

  it("returns 'fable' for genderqueer preference", () => {
    expect(getVoiceForPreference("genderqueer")).toBe("fable");
  });

  it("returns 'alloy' for no-preference", () => {
    expect(getVoiceForPreference("no-preference")).toBe("alloy");
  });
});
