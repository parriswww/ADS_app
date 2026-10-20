import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseVoiceDictationResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setTranscript: (text: string) => void;
}

export function useVoiceDictation(): UseVoiceDictationResult {
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscriptState] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const shouldListenRef = useRef(false);

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTextRef.current = (finalTextRef.current + " " + text).trim();
          setTranscriptState(finalTextRef.current);
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      const e = event as { error?: string };
      if (e.error === "no-speech") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone permission denied. Enable mic access in browser settings.");
        setListening(false);
        shouldListenRef.current = false;
      }
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (shouldListenRef.current) {
        try {
          recognition.start();
          setListening(true);
        } catch {
          setListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    setError(null);
    shouldListenRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    shouldListenRef.current = false;
    try {
      recognition.stop();
    } catch {
      /* noop */
    }
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    finalTextRef.current = "";
    setTranscriptState("");
    setInterim("");
    setError(null);
  }, []);

  const setTranscript = useCallback((text: string) => {
    finalTextRef.current = text;
    setTranscriptState(text);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
    setTranscript,
  };
}
