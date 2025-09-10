import { useState, useEffect, useRef } from "react";

type UseSpeechToTextOptions = {
  onTranscriptFinal?: (spokenText: string) => void;
};

export default function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }

    interface ExtendedSpeechRecognition extends SpeechRecognition {
      onend: (() => void) | null;
    }

    const recognition: ExtendedSpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();

      setTranscript((prev) => {
        const updated = `${prev} ${result}`.trim();
        return updated;
      });

      // 🔥 Trigger callback when result is finalized
      if (options.onTranscriptFinal) {
        options.onTranscriptFinal(result);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) recognition.start(); // auto-restart
    };

    recognitionRef.current = recognition;
  }, [isListening, options]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(""); // optional: reset
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
  };
}

