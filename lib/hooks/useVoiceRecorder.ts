"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing";

interface UseVoiceRecorderReturn {
  state: RecorderState;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  stream: MediaStream | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setState("idle");
        cleanup();
      };

      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        setState("idle");
        cleanup();
      };

      recorder.start(250); // collect data every 250ms
      startTimeRef.current = Date.now();
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access in your browser settings."
          : "Could not access microphone. Please check your device.";
      setError(msg);
      setState("idle");
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      setState("processing");
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setState("idle");
  }, []);

  return {
    state,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset,
    stream,
  };
}
