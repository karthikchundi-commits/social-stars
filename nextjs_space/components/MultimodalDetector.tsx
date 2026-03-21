'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Smile, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const FACE_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const EXPRESSION_MAP: Record<string, string> = {
  happy: 'happy', sad: 'sad', angry: 'frustrated',
  fearful: 'scared', disgusted: 'frustrated',
  surprised: 'surprised', neutral: 'neutral',
};

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
  focused: '🧐', neutral: '😐', anxious: '😰',
  surprised: '😲', scared: '😨',
};

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-100 border-yellow-300',
  sad: 'bg-blue-100 border-blue-300',
  frustrated: 'bg-red-100 border-red-300',
  neutral: 'bg-gray-100 border-gray-300',
  surprised: 'bg-pink-100 border-pink-300',
  scared: 'bg-indigo-100 border-indigo-300',
  anxious: 'bg-purple-100 border-purple-300',
  confused: 'bg-orange-100 border-orange-300',
};

export type DetectableAction = 'raise_hand' | 'wave';

export const ACTION_KEYWORDS: Record<DetectableAction, string[]> = {
  raise_hand: ['raise your hand', 'raise hand', 'put your hand up', 'hand up', 'raised hand'],
  wave: ['wave', 'waving'],
};

export function extractAction(text: string): DetectableAction | null {
  const lower = text.toLowerCase();
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return action as DetectableAction;
  }
  return null;
}

function emotionMatches(detected: string, target: string): boolean {
  if (detected === target) return true;
  if (target === 'excited') return detected === 'happy' || detected === 'surprised';
  if (target === 'scared') return ['scared', 'surprised', 'sad', 'anxious'].includes(detected);
  if (target === 'angry') return detected === 'frustrated';
  return false;
}

interface MultimodalDetectorProps {
  childId: string;
  activityId?: string;
  sessionId: string;
  targetEmotion?: string;
  targetAction?: DetectableAction;
  targetActionLabel?: string;
  onEmotionMatch?: () => void;
  onActionMatch?: () => void;
}

export function MultimodalDetector({
  childId, activityId, sessionId,
  targetEmotion, targetAction, targetActionLabel,
  onEmotionMatch, onActionMatch,
}: MultimodalDetectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [detectedAction, setDetectedAction] = useState<string | null>(null);
  const [emotionMatched, setEmotionMatched] = useState(false);
  const [actionMatched, setActionMatched] = useState(false);
  const [status, setStatus] = useState('');
  const [modelsReady, setModelsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const poseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceApiRef = useRef<any>(null);
  const poseDetectorRef = useRef<any>(null);
  const emotionMatchedRef = useRef(false);
  const actionMatchedRef = useRef(false);

  // Always keep callback refs fresh — fixes stale closure with setInterval
  const onEmotionMatchRef = useRef(onEmotionMatch);
  const onActionMatchRef = useRef(onActionMatch);
  useEffect(() => { onEmotionMatchRef.current = onEmotionMatch; }, [onEmotionMatch]);
  useEffect(() => { onActionMatchRef.current = onActionMatch; }, [onActionMatch]);

  // Reset match flags when targets change (e.g. story page changes)
  useEffect(() => {
    emotionMatchedRef.current = false;
    setEmotionMatched(false);
  }, [targetEmotion]);

  useEffect(() => {
    actionMatchedRef.current = false;
    setActionMatched(false);
    setDetectedAction(null);
  }, [targetAction]);

  // Load both models on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatus('⏳ Loading models...');
      try {
        const [faceapi, tf, poseDetection] = await Promise.all([
          import('face-api.js'),
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/pose-detection'),
        ]);
        await tf.ready();
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(FACE_MODEL_URL),
        ]);
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: (poseDetection as any).movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (!cancelled) {
          faceApiRef.current = faceapi;
          poseDetectorRef.current = detector;
          setModelsReady(true);
          setStatus('✅ Ready');
        }
      } catch (err: any) {
        if (!cancelled) setStatus(`❌ ${err.message}`);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const runFaceDetection = useCallback(async () => {
    const video = videoRef.current;
    const faceapi = faceApiRef.current;
    if (!video || !faceapi || video.videoWidth === 0) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (!detections?.length) return;

      const expressions = detections[0].expressions as Record<string, number>;
      const [topExpr, topScore] = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotion = EXPRESSION_MAP[topExpr] ?? 'neutral';
      setCurrentEmotion(emotion);

      if (targetEmotion && emotionMatches(emotion, targetEmotion) && !emotionMatchedRef.current) {
        emotionMatchedRef.current = true;
        setEmotionMatched(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        speak(`You're showing ${targetEmotion}! Great job!`);
        onEmotionMatchRef.current?.();
        setTimeout(() => { emotionMatchedRef.current = false; setEmotionMatched(false); }, 10000);
      }

      // Save to DB
      fetch('/api/emotion-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, sessionId, source: 'face', detectedEmotion: emotion, confidence: topScore }),
      }).catch(() => {});
    } catch { /* silent */ }
  }, [childId, activityId, sessionId, targetEmotion]);

  const runPoseDetection = useCallback(async () => {
    const video = videoRef.current;
    const detector = poseDetectorRef.current;
    if (!video || !detector || video.videoWidth === 0) return;

    try {
      const poses = await detector.estimatePoses(video);
      if (!poses?.length) return;
      const kp = poses[0].keypoints;
      const get = (name: string) => kp.find((k: any) => k.name === name);
      const conf = (k: any) => (k?.score ?? 0) > 0.3;

      const lw = get('left_wrist'), rw = get('right_wrist');
      const ls = get('left_shoulder'), rs = get('right_shoulder');

      let action: DetectableAction | null = null;
      if ((conf(rw) && conf(rs) && rw.y < rs.y) || (conf(lw) && conf(ls) && lw.y < ls.y)) {
        action = 'raise_hand';
      }

      if (action) {
        setDetectedAction(action);
        setStatus(`✅ ${action.replace('_', ' ')}`);
        if (targetAction && action === targetAction && !actionMatchedRef.current) {
          actionMatchedRef.current = true;
          setActionMatched(true);
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          speak(`Great job! You ${targetActionLabel ?? action.replace('_', ' ')}!`);
          onActionMatchRef.current?.();
          setTimeout(() => { actionMatchedRef.current = false; setActionMatched(false); }, 10000);
        }
      } else {
        setDetectedAction(null);
      }
    } catch { /* silent */ }
  }, [targetAction, targetActionLabel]);

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.3;
      window.speechSynthesis.speak(u);
    }
  };

  const handleToggle = async () => {
    if (isActive) {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsActive(false); setShowCamera(false);
      setStatus(modelsReady ? '✅ Ready' : '');
      return;
    }
    if (!modelsReady) { setStatus('⏳ Still loading...'); return; }
    setShowCamera(true);
    setStatus('🎥 Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsActive(true);
        setStatus('🔍 Detecting...');
        // Run face detection every 5s, pose every 2s — same camera feed
        setTimeout(runFaceDetection, 1500);
        setTimeout(runPoseDetection, 1500);
        faceIntervalRef.current = setInterval(runFaceDetection, 5000);
        poseIntervalRef.current = setInterval(runPoseDetection, 2000);
      }, 200);
    } catch (err: any) {
      setStatus(`❌ Camera: ${err.message}`);
    }
  };

  const runNow = () => { runFaceDetection(); runPoseDetection(); };

  const hasTarget = targetEmotion || targetAction;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Match banners */}
      {emotionMatched && (
        <div className="bg-yellow-400 text-white text-sm font-bold px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1 animate-bounce">
          <Star className="w-4 h-4 fill-white" /> You showed {targetEmotion}! ⭐
        </div>
      )}
      {actionMatched && (
        <div className="bg-green-400 text-white text-sm font-bold px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1 animate-bounce">
          <Star className="w-4 h-4 fill-white" /> {targetActionLabel ?? targetAction?.replace('_', ' ')}! ⭐
        </div>
      )}

      {/* Prompts */}
      {isActive && targetEmotion && !emotionMatched && (
        <div className="bg-purple-100 border border-purple-300 text-purple-700 text-xs px-2 py-1 rounded-xl text-right">
          Show your <strong>{targetEmotion}</strong> face! 😄
        </div>
      )}
      {isActive && targetAction && !actionMatched && (
        <div className="bg-blue-100 border border-blue-300 text-blue-700 text-xs px-2 py-1 rounded-xl text-right">
          Try: <strong>{targetActionLabel ?? targetAction.replace('_', ' ')}</strong> 📷
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-xl max-w-52 text-right">{status}</div>
      )}

      {/* Emotion badge */}
      {isActive && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 shadow-lg ${EMOTION_COLORS[currentEmotion] ?? 'bg-gray-100 border-gray-300'}`}>
          <span className="text-2xl">{EMOTION_EMOJI[currentEmotion] ?? '😐'}</span>
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {currentEmotion}
            {detectedAction && <span className="ml-1 text-blue-600">✋</span>}
          </span>
        </div>
      )}

      {/* Single camera preview */}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-24 ${showCamera ? 'block' : 'hidden'}`} style={{ height: '72px' }}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>

      {/* Detect now */}
      {isActive && (
        <button onClick={runNow} title="Detect now" className="p-2 rounded-full shadow-lg bg-yellow-400 text-white hover:bg-yellow-500">
          <Zap className="w-4 h-4" />
        </button>
      )}

      {/* Toggle */}
      <button
        onClick={handleToggle}
        title={isActive ? 'Turn off' : 'Turn on camera detection'}
        className={`p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-purple-50'}`}
      >
        {isActive ? <Camera className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
      </button>
    </div>
  );
}
