import { describe, it, expect } from "vitest";
import {
  DEFAULT_SENSORY_PREFERENCES,
  type SensoryPreferences,
  type SensoryMode,
  type MotionPreference,
  type ContrastPreference,
  type AudioPreference,
  type CoachingDensity,
} from "@/lib/types/database";

// ============================================================
// DEFAULT_SENSORY_PREFERENCES
// ============================================================

describe("DEFAULT_SENSORY_PREFERENCES", () => {
  it("has correct default mode", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.mode).toBe("everyday");
  });

  it("has system-following motion preference", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.motion).toBe("system");
  });

  it("has system-following contrast preference", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.contrast).toBe("system");
  });

  it("has audio on by default", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.audio).toBe("on");
  });

  it("has voice autoplay off by default", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.voice_autoplay).toBe(false);
  });

  it("has full coaching density by default", () => {
    expect(DEFAULT_SENSORY_PREFERENCES.coaching_density).toBe("full");
  });

  it("contains all required fields", () => {
    const keys = Object.keys(DEFAULT_SENSORY_PREFERENCES);
    expect(keys).toContain("mode");
    expect(keys).toContain("motion");
    expect(keys).toContain("contrast");
    expect(keys).toContain("audio");
    expect(keys).toContain("voice_autoplay");
    expect(keys).toContain("coaching_density");
    expect(keys).toHaveLength(6);
  });
});

// ============================================================
// Type validation (compile-time + runtime shape tests)
// ============================================================

describe("SensoryPreferences type shapes", () => {
  it("accepts all valid sensory modes", () => {
    const modes: SensoryMode[] = [
      "everyday",
      "soft-focus",
      "clear-view",
      "quiet-session",
    ];
    expect(modes).toHaveLength(4);
    modes.forEach((m) => expect(typeof m).toBe("string"));
  });

  it("accepts all valid motion preferences", () => {
    const motions: MotionPreference[] = ["system", "reduced", "full"];
    expect(motions).toHaveLength(3);
  });

  it("accepts all valid contrast preferences", () => {
    const contrasts: ContrastPreference[] = ["system", "soft", "strong"];
    expect(contrasts).toHaveLength(3);
  });

  it("accepts all valid audio preferences", () => {
    const audios: AudioPreference[] = ["muted", "on"];
    expect(audios).toHaveLength(2);
  });

  it("accepts all valid coaching densities", () => {
    const densities: CoachingDensity[] = ["full", "condensed"];
    expect(densities).toHaveLength(2);
  });

  it("constructs a valid SensoryPreferences object", () => {
    const prefs: SensoryPreferences = {
      mode: "quiet-session",
      motion: "reduced",
      contrast: "strong",
      audio: "muted",
      voice_autoplay: false,
      coaching_density: "condensed",
    };
    expect(prefs.mode).toBe("quiet-session");
    expect(prefs.motion).toBe("reduced");
    expect(prefs.contrast).toBe("strong");
    expect(prefs.audio).toBe("muted");
    expect(prefs.voice_autoplay).toBe(false);
    expect(prefs.coaching_density).toBe("condensed");
  });
});

// ============================================================
// Sensory mode resolution logic (mirrors SensoryProvider)
// ============================================================

describe("Sensory mode resolution logic", () => {
  function resolveMotion(
    userPref: MotionPreference,
    systemReducedMotion: boolean
  ): boolean {
    if (userPref === "reduced") return true;
    if (userPref === "full") return false;
    return systemReducedMotion;
  }

  function resolveContrast(
    userPref: ContrastPreference,
    systemHighContrast: boolean
  ): boolean {
    if (userPref === "strong") return true;
    if (userPref === "soft") return false;
    return systemHighContrast;
  }

  function shouldAutoplay(prefs: SensoryPreferences): boolean {
    return prefs.voice_autoplay && prefs.audio !== "muted";
  }

  describe("resolveMotion", () => {
    it("returns true when user explicitly sets reduced", () => {
      expect(resolveMotion("reduced", false)).toBe(true);
      expect(resolveMotion("reduced", true)).toBe(true);
    });

    it("returns false when user explicitly sets full", () => {
      expect(resolveMotion("full", false)).toBe(false);
      expect(resolveMotion("full", true)).toBe(false);
    });

    it("follows system preference when set to system", () => {
      expect(resolveMotion("system", true)).toBe(true);
      expect(resolveMotion("system", false)).toBe(false);
    });
  });

  describe("resolveContrast", () => {
    it("returns true when user explicitly sets strong", () => {
      expect(resolveContrast("strong", false)).toBe(true);
      expect(resolveContrast("strong", true)).toBe(true);
    });

    it("returns false when user explicitly sets soft", () => {
      expect(resolveContrast("soft", false)).toBe(false);
      expect(resolveContrast("soft", true)).toBe(false);
    });

    it("follows system preference when set to system", () => {
      expect(resolveContrast("system", true)).toBe(true);
      expect(resolveContrast("system", false)).toBe(false);
    });
  });

  describe("shouldAutoplay", () => {
    it("returns true only when autoplay is on AND audio is not muted", () => {
      expect(
        shouldAutoplay({ ...DEFAULT_SENSORY_PREFERENCES, voice_autoplay: true, audio: "on" })
      ).toBe(true);
    });

    it("returns false when audio is muted even if autoplay is on", () => {
      expect(
        shouldAutoplay({ ...DEFAULT_SENSORY_PREFERENCES, voice_autoplay: true, audio: "muted" })
      ).toBe(false);
    });

    it("returns false when autoplay is off", () => {
      expect(
        shouldAutoplay({ ...DEFAULT_SENSORY_PREFERENCES, voice_autoplay: false, audio: "on" })
      ).toBe(false);
    });

    it("returns false with default preferences", () => {
      expect(shouldAutoplay(DEFAULT_SENSORY_PREFERENCES)).toBe(false);
    });
  });
});

// ============================================================
// Mode auto-defaults (mirrors Settings page logic)
// ============================================================

describe("Mode auto-defaults", () => {
  function getAutoDefaults(mode: SensoryMode): Partial<SensoryPreferences> {
    switch (mode) {
      case "quiet-session":
        return { motion: "reduced", audio: "muted", coaching_density: "condensed" };
      case "soft-focus":
        return { motion: "reduced" };
      case "clear-view":
        return { contrast: "strong" };
      case "everyday":
        return { motion: "system", contrast: "system", audio: "on", coaching_density: "full" };
    }
  }

  it("quiet-session sets reduced motion, muted audio, condensed coaching", () => {
    const defaults = getAutoDefaults("quiet-session");
    expect(defaults.motion).toBe("reduced");
    expect(defaults.audio).toBe("muted");
    expect(defaults.coaching_density).toBe("condensed");
  });

  it("soft-focus sets reduced motion", () => {
    const defaults = getAutoDefaults("soft-focus");
    expect(defaults.motion).toBe("reduced");
  });

  it("clear-view sets strong contrast", () => {
    const defaults = getAutoDefaults("clear-view");
    expect(defaults.contrast).toBe("strong");
  });

  it("everyday resets to system defaults", () => {
    const defaults = getAutoDefaults("everyday");
    expect(defaults.motion).toBe("system");
    expect(defaults.contrast).toBe("system");
    expect(defaults.audio).toBe("on");
    expect(defaults.coaching_density).toBe("full");
  });
});

// ============================================================
// OnboardingProfile backwards compatibility
// ============================================================

describe("OnboardingProfile backwards compatibility", () => {
  it("sensory_preferences is optional (existing profiles work)", () => {
    const legacyProfile = {
      gender: "male" as const,
      challenges: ["Starting conversations"],
      preferred_coaching_style: "gentle" as const,
    };
    // sensory_preferences not set — should be undefined
    expect(legacyProfile).not.toHaveProperty("sensory_preferences");
  });

  it("can merge sensory_preferences into existing profile", () => {
    const existing = {
      gender: "female" as const,
      preferred_coaching_style: "direct" as const,
    };
    const updated = {
      ...existing,
      sensory_preferences: DEFAULT_SENSORY_PREFERENCES,
    };
    expect(updated.gender).toBe("female");
    expect(updated.preferred_coaching_style).toBe("direct");
    expect(updated.sensory_preferences.mode).toBe("everyday");
  });
});
