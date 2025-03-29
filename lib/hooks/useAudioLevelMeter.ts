import { useState, useEffect, useRef, useCallback } from "react";

type AudioSourceType = "microphone" | "speaker";

interface AudioLevelMeterProps {
  stream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
}

/**
 * Create a logger for debugging
 */
const createLogger = (component: string) => {
  return {
    debug: (message: string, ...args: any[]) =>
      console.debug(`[${component}] ${message}`, ...args),
    info: (message: string, ...args: any[]) =>
      console.info(`[${component}] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[${component}] ${message}`, ...args),
  };
};

const logger = createLogger("AudioLevelMeter");

/**
 * A hook for measuring audio levels from a microphone stream or audio element
 * @param sourceType The type of audio source to analyze (microphone or speaker)
 * @param stream The MediaStream to analyze (for microphone)
 * @param audioElement The HTMLAudioElement to analyze (for speaker)
 * @returns An object with the current audio level and control functions
 */
export const useAudioLevelMeter = (
  sourceType: AudioSourceType,
  stream: MediaStream | null = null,
  audioElement: HTMLAudioElement | null = null
) => {
  const [level, setLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<
    MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null
  >(null);
  const animationFrameRef = useRef<number | null>(null);

  // Set up the audio context and analyzer
  const initializeAnalyzer = useCallback(() => {
    try {
      // Clean up existing context if it exists
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Create a new audio context
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Configure analyzer
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create source node based on source type
      if (sourceType === "microphone" && stream) {
        sourceNodeRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
      } else if (sourceType === "speaker" && audioElement) {
        sourceNodeRef.current =
          audioContextRef.current.createMediaElementSource(audioElement);
        // Connect to destination (speakers) for audio element
        analyserRef.current.connect(audioContextRef.current.destination);
      } else {
        throw new Error(`Invalid source type or missing ${sourceType} source`);
      }

      // Connect source to analyzer
      sourceNodeRef.current.connect(analyserRef.current);

      logger.debug(`Initialized analyzer for ${sourceType}`);
      return true;
    } catch (error) {
      logger.error("Error initializing analyzer:", error);
      return false;
    }
  }, [sourceType, stream, audioElement]);

  // Start analyzing audio levels
  const startAnalyzing = useCallback(() => {
    if (isAnalyzing) return;

    const success = initializeAnalyzer();
    if (!success) return;

    setIsAnalyzing(true);

    // Set up continuous analysis
    const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);

    const analyze = () => {
      if (!analyserRef.current || !isAnalyzing) return;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      // Convert to percentage (0-100)
      const normalizedLevel = Math.min(100, Math.round((average / 256) * 100));
      setLevel(normalizedLevel);

      // Schedule next analysis
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    // Start analysis loop
    animationFrameRef.current = requestAnimationFrame(analyze);
    logger.debug(`Started analyzing ${sourceType} levels`);
  }, [initializeAnalyzer, isAnalyzing, sourceType]);

  // Stop analyzing audio levels
  const stopAnalyzing = useCallback(() => {
    if (!isAnalyzing) return;

    setIsAnalyzing(false);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset level
    setLevel(0);

    logger.debug(`Stopped analyzing ${sourceType} levels`);
  }, [isAnalyzing, sourceType]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      logger.debug("Audio level meter cleaned up");
    };
  }, [stopAnalyzing]);

  // Re-initialize when stream or audio element changes
  useEffect(() => {
    if (isAnalyzing) {
      stopAnalyzing();
      startAnalyzing();
    }
  }, [stream, audioElement, isAnalyzing, stopAnalyzing, startAnalyzing]);

  return {
    level,
    isAnalyzing,
    startAnalyzing,
    stopAnalyzing,
  };
};
