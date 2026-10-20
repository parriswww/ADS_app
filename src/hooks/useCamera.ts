import { useCallback, useEffect, useRef, useState } from "react";

interface UseCameraOptions {
  facingMode?: "environment" | "user";
}

export interface UseCameraResult {
  stream: MediaStream | null;
  active: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  capture: (video: HTMLVideoElement) => string | null;
}

export function useCamera({ facingMode = "environment" }: UseCameraOptions = {}): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported on this device.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
      setActive(true);
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError") {
        setError("Camera permission denied. Enable camera access in browser settings.");
      } else if (e.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera. " + e.message);
      }
      setActive(false);
    }
  }, [facingMode]);

  const capture = useCallback((video: HTMLVideoElement): string | null => {
    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  useEffect(() => {
    return () => {
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { stream, active, error, start, stop, capture };
}
