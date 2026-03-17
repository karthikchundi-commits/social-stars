import { useState, useRef, useCallback, useEffect } from 'react';

interface EmotionDetectionOptions {
  childId: string;
  activityId?: string;
  sessionId: string;
  enabled?: boolean;
  intervalMs?: number;
}

export function useEmotionDetection({
  childId,
  activityId,
  sessionId,
  enabled = false,
  intervalMs = 15000,
}: EmotionDetectionOptions) {
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [isActive, setIsActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !isActive) return;

    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      if (!canvasRef.current) canvasRef.current = canvas;
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      const response = await fetch('/api/emotion-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, sessionId, source: 'face', imageData }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.detectedEmotion) setCurrentEmotion(data.detectedEmotion);
      }
    } catch (error) {
      // Silent fail - don't disrupt child experience
    }
  }, [childId, activityId, sessionId, isActive]);

  const startDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionGranted(true);
      setIsActive(true);
    } catch (error) {
      console.log('Camera not available');
    }
  }, []);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(captureAndAnalyze, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, captureAndAnalyze, intervalMs]);

  useEffect(() => {
    if (enabled) startDetection();
    return () => stopDetection();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const emotionEmoji: Record<string, string> = {
    happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
    focused: '🧐', neutral: '😐', anxious: '😰',
  };

  return {
    currentEmotion,
    emotionEmoji: emotionEmoji[currentEmotion] ?? '😐',
    isActive,
    permissionGranted,
    videoRef,
    startDetection,
    stopDetection,
  };
}
