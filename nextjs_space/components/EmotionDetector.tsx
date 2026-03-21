'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Smile, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

// Models hosted on GitHub raw — no cost, no API key needed
const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Map face-api.js expressions → our emotion labels
const EXPRESSION_MAP: Record<string, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'frustrated',
  fearful: 'anxious',
  disgusted: 'frustrated',
  surprised: 'surprised',
  neutral: 'neutral',
};

interface EmotionDetectorProps {
  childId: string;
  activityId?: string;
  sessionId: string;
  targetEmotion?: string;       // e.g. "happy" — celebrate when face matches
  onEmotionMatch?: () => void;  // optional callback when match fires
}

export function EmotionDetector({ childId, activityId, sessionId, targetEmotion, onEmotionMatch }: EmotionDetectorProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [status, setStatus] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [matched, setMatched] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceApiRef = useRef<any>(null);

  const emotionEmoji: Record<string, string> = {
    happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
    focused: '🧐', neutral: '😐', anxious: '😰', surprised: '😲',
  };
  const emotionColors: Record<string, string> = {
    happy: 'bg-yellow-100 border-yellow-300',
    sad: 'bg-blue-100 border-blue-300',
    confused: 'bg-orange-100 border-orange-300',
    frustrated: 'bg-red-100 border-red-300',
    focused: 'bg-green-100 border-green-300',
    neutral: 'bg-gray-100 border-gray-300',
    anxious: 'bg-purple-100 border-purple-300',
    surprised: 'bg-pink-100 border-pink-300',
  };

  // Load face-api.js models once on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setStatus('⏳ Loading models...');
        const faceapi = await import('face-api.js');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) {
          faceApiRef.current = faceapi;
          setModelsLoaded(true);
          setStatus('✅ Ready');
        }
      } catch (err: any) {
        if (!cancelled) setStatus(`❌ Model load failed: ${err.message}`);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const captureAndAnalyze = async () => {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || video.videoWidth === 0) {
      setStatus('⏳ Video not ready yet...');
      return;
    }

    setStatus('🔍 Detecting...');
    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (!detections || detections.length === 0) {
        setStatus('👤 No face detected');
        return;
      }

      const expressions = detections[0].expressions as Record<string, number>;
      // Find the dominant expression
      const [topExpression, topScore] = Object.entries(expressions).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );
      const emotion = EXPRESSION_MAP[topExpression] ?? 'neutral';
      setCurrentEmotion(emotion);
      setStatus(`✅ ${emotion} (${Math.round(topScore * 100)}%)`);

      // Celebrate if detected emotion matches the activity's target emotion
      if (targetEmotion && emotion === targetEmotion && !matched) {
        setMatched(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(`You're showing ${emotion}! Great job! ⭐`);
          u.rate = 0.9; u.pitch = 1.3;
          window.speechSynthesis.speak(u);
        }
        onEmotionMatch?.();
        // Allow re-triggering after 10 seconds
        setTimeout(() => setMatched(false), 10000);
      }

      // Save to DB (no Claude needed — just store the result)
      await fetch('/api/emotion-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId, activityId, sessionId,
          source: 'face',
          detectedEmotion: emotion,
          confidence: topScore,
        }),
      }).catch(() => {});
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const handleToggle = async () => {
    if (isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsActive(false);
      setShowCamera(false);
      setStatus(modelsLoaded ? '✅ Ready' : '');
      return;
    }

    if (!modelsLoaded) {
      setStatus('⏳ Still loading models, please wait...');
      return;
    }

    setShowCamera(true);
    setStatus('🎥 Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      // Small delay so the video element renders before attaching stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setIsActive(true);
          setStatus('✅ Camera on — detecting...');
          setTimeout(captureAndAnalyze, 1500);
          intervalRef.current = setInterval(captureAndAnalyze, 5000); // every 5s
        }
      }, 200);
    } catch (err: any) {
      setStatus(`❌ Camera: ${err.message}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Match celebration banner */}
      {matched && (
        <div className="bg-yellow-400 text-white text-sm font-bold px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1 animate-bounce">
          <Star className="w-4 h-4 fill-white" />
          You showed {targetEmotion}!
        </div>
      )}

      {/* Target emotion hint */}
      {isActive && targetEmotion && !matched && (
        <div className="bg-purple-100 border border-purple-300 text-purple-700 text-xs px-2 py-1 rounded-xl text-right">
          Show your <strong>{targetEmotion}</strong> face! 😄
        </div>
      )}

      {/* Status line */}
      {status && (
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-xl max-w-52 text-right">
          {status}
        </div>
      )}

      {/* Emotion badge */}
      {isActive && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 shadow-lg ${emotionColors[currentEmotion] ?? 'bg-gray-100 border-gray-300'}`}>
          <span className="text-2xl">{emotionEmoji[currentEmotion] ?? '😐'}</span>
          <span className="text-sm font-semibold text-gray-700 capitalize">{currentEmotion}</span>
        </div>
      )}

      {/* Camera preview — always mounted so ref is ready */}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-24 h-18 ${showCamera ? 'block' : 'hidden'}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>

      {/* Detect now button */}
      {isActive && (
        <button
          onClick={captureAndAnalyze}
          title="Detect emotion now"
          className="p-2 rounded-full shadow-lg bg-yellow-400 text-white hover:bg-yellow-500 transition-all"
        >
          <Zap className="w-4 h-4" />
        </button>
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        title={isActive ? 'Turn off emotion detection' : 'Turn on emotion detection'}
        className={`p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-purple-50'}`}
      >
        {isActive ? <Camera className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
      </button>
    </div>
  );
}
