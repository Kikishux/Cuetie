"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  SensoryPreferences,
  SensoryMode,
  MotionPreference,
  ContrastPreference,
  AudioPreference,
  CoachingDensity,
} from "@/lib/types/database";
import { DEFAULT_SENSORY_PREFERENCES } from "@/lib/types/database";

interface SensoryContextValue {
  preferences: SensoryPreferences;
  setPreferences: (prefs: Partial<SensoryPreferences>) => void;
  /** Resolved motion — combines user pref with system media query */
  reducedMotion: boolean;
  /** Resolved contrast — combines user pref with system media query */
  highContrast: boolean;
  /** Whether voice replies should auto-play */
  shouldAutoplay: boolean;
  /** Whether coaching should be condensed */
  isCondensed: boolean;
  /** Whether the mode is quiet-session (single-column, minimal) */
  isQuietSession: boolean;
}

const SensoryContext = createContext<SensoryContextValue | undefined>(undefined);

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

interface SensoryProviderProps {
  children: ReactNode;
  initial?: SensoryPreferences;
}

export function SensoryProvider({ children, initial }: SensoryProviderProps) {
  const [preferences, setPreferencesState] = useState<SensoryPreferences>(
    initial ?? DEFAULT_SENSORY_PREFERENCES
  );

  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const systemHighContrast = useMediaQuery("(prefers-contrast: more)");

  // Resolve motion: user pref > system pref
  const reducedMotion = useMemo(() => {
    if (preferences.motion === "reduced") return true;
    if (preferences.motion === "full") return false;
    // "system" — follow OS
    return systemReducedMotion;
  }, [preferences.motion, systemReducedMotion]);

  // Resolve contrast: user pref > system pref
  const highContrast = useMemo(() => {
    if (preferences.contrast === "strong") return true;
    if (preferences.contrast === "soft") return false;
    return systemHighContrast;
  }, [preferences.contrast, systemHighContrast]);

  const shouldAutoplay = preferences.voice_autoplay && preferences.audio !== "muted";
  const isCondensed = preferences.coaching_density === "condensed";
  const isQuietSession = preferences.mode === "quiet-session";

  // Set data attributes on <html> for CSS token overrides
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-sensory-mode", preferences.mode);
    html.setAttribute("data-motion", reducedMotion ? "reduced" : "full");
    html.setAttribute("data-contrast", highContrast ? "high" : "normal");
    html.setAttribute("data-audio", preferences.audio);
  }, [preferences.mode, preferences.audio, reducedMotion, highContrast]);

  const setPreferences = useCallback((partial: Partial<SensoryPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      reducedMotion,
      highContrast,
      shouldAutoplay,
      isCondensed,
      isQuietSession,
    }),
    [preferences, setPreferences, reducedMotion, highContrast, shouldAutoplay, isCondensed, isQuietSession]
  );

  return (
    <SensoryContext.Provider value={value}>
      {children}
    </SensoryContext.Provider>
  );
}

export function useSensory(): SensoryContextValue {
  const context = useContext(SensoryContext);
  if (context === undefined) {
    throw new Error("useSensory must be used within a SensoryProvider");
  }
  return context;
}

/**
 * Safe version that returns defaults when used outside the provider
 * (e.g. on auth pages before login).
 */
export function useSensoryOptional(): SensoryContextValue {
  const context = useContext(SensoryContext);
  if (context === undefined) {
    return {
      preferences: DEFAULT_SENSORY_PREFERENCES,
      setPreferences: () => {},
      reducedMotion: false,
      highContrast: false,
      shouldAutoplay: false,
      isCondensed: false,
      isQuietSession: false,
    };
  }
  return context;
}
