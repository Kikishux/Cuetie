"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PlayerState = "idle" | "loading" | "playing" | "paused";

interface UseAudioPlayerReturn {
  state: PlayerState;
  currentTime: number;
  totalDuration: number;
  play: (src: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [state, setState] = useState<PlayerState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<string[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [clearTimer]);

  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setState("idle");
      return;
    }
    const src = queueRef.current.shift()!;
    playSource(src);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSource = useCallback(
    (src: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
        clearTimer();
      }

      setState("loading");
      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setTotalDuration(audio.duration);
      };

      audio.onplay = () => {
        setState("playing");
        timerRef.current = setInterval(() => {
          setCurrentTime(audio.currentTime);
        }, 250);
      };

      audio.onpause = () => {
        if (audio.currentTime < audio.duration) {
          setState("paused");
        }
        clearTimer();
      };

      audio.onended = () => {
        clearTimer();
        setCurrentTime(0);
        playNext();
      };

      audio.onerror = () => {
        clearTimer();
        setState("idle");
        playNext();
      };

      audio.play().catch(() => {
        setState("idle");
      });
    },
    [clearTimer, playNext]
  );

  const play = useCallback(
    (src: string) => {
      if (state === "playing" || state === "loading") {
        queueRef.current.push(src);
        return;
      }
      playSource(src);
    },
    [state, playSource]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    clearTimer();
    queueRef.current = [];
    setCurrentTime(0);
    setState("idle");
  }, [clearTimer]);

  return { state, currentTime, totalDuration, play, pause, resume, stop };
}
