'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

// Actions we can detect from body pose keypoints
export type DetectableAction = 'raise_hand' | 'wave' | 'nod' | 'clap';

interface ActionDetectorProps {
  targetAction?: DetectableAction; // action to watch for
  targetLabel?: string;            // human label e.g. "Raise your hand"
  onActionMatch?: () => void;      // called when action is detected
}

// Map story answer text → action keyword
const ACTION_KEYWORDS: Record<DetectableAction, string[]> = {
  raise_hand: ['raise your hand', 'raise hand', 'put your hand up', 'hand up', 'raised hand'],
  wave:       ['wave', 'waving'],
  nod:        ['nod', 'nodding'],
  clap:       ['clap', 'clapping'],
};

export function extractAction(text: string): DetectableAction | null {
  const lower = text.toLowerCase();
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return action as DetectableAction;
  }
  return null;
}

export function ActionDetector({ targetAction, targetLabel, onActionMatch }: ActionDetectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('');
  const [matched, setMatched] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectorRef = useRef<any>(null);
  const matchedRef = useRef(false);

  // Load MoveNet model
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setStatus('⏳ Loading pose model...');
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const poseDetection = await import('@tensorflow-models/pose-detection');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (!cancelled) {
          detectorRef.current = detector;
          setStatus('✅ Ready');
        }
      } catch (err: any) {
        if (!cancelled) setStatus(`❌ Model error: ${err.message}`);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const detectAction = async (): Promise<DetectableAction | null> => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.videoWidth === 0) return null;

    try {
      const poses = await detector.estimatePoses(video);
      if (!poses || poses.length === 0) return null;

      const kp = poses[0].keypoints;
      const get = (name: string) => kp.find((k: any) => k.name === name);

      const leftWrist    = get('left_wrist');
      const rightWrist   = get('right_wrist');
      const leftShoulder = get('left_shoulder');
      const rightShoulder= get('right_shoulder');
      const leftElbow    = get('left_elbow');
      const rightElbow   = get('right_elbow');

      const conf = (k: any) => (k?.score ?? 0) > 0.3;

      // Raise hand: wrist y is above (lower pixel value) than shoulder y
      if (
        (conf(rightWrist) && conf(rightShoulder) && rightWrist.y < rightShoulder.y) ||
        (conf(leftWrist)  && conf(leftShoulder)  && leftWrist.y  < leftShoulder.y)
      ) return 'raise_hand';

      // Wave: wrist above elbow and moving side (elbow above shoulder)
      if (
        (conf(rightWrist) && conf(rightElbow) && conf(rightShoulder) &&
         rightWrist.y < rightElbow.y && rightElbow.y < rightShoulder.y) ||
        (conf(leftWrist)  && conf(leftElbow)  && conf(leftShoulder)  &&
         leftWrist.y  < leftElbow.y  && leftElbow.y  < leftShoulder.y)
      ) return 'wave';

      return null;
    } catch {
      return null;
    }
  };

  const runDetection = async () => {
    if (matchedRef.current) return;
    setStatus('🔍 Watching...');
    const action = await detectAction();
    if (action) {
      setStatus(`✅ Detected: ${action.replace('_', ' ')}`);
      if (targetAction && action === targetAction && !matchedRef.current) {
        matchedRef.current = true;
        setMatched(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(`Great job! You ${targetLabel ?? action.replace('_', ' ')}!`);
          u.rate = 0.9; u.pitch = 1.3;
          window.speechSynthesis.speak(u);
        }
        onActionMatch?.();
        setTimeout(() => { matchedRef.current = false; setMatched(false); }, 10000);
      }
    } else {
      setStatus('👀 Keep going...');
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
      setStatus('✅ Ready');
      return;
    }

    if (!detectorRef.current) {
      setStatus('⏳ Still loading model...');
      return;
    }

    setShowCamera(true);
    setStatus('🎥 Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setIsActive(true);
          setStatus('👀 Watching for action...');
          setTimeout(runDetection, 1500);
          intervalRef.current = setInterval(runDetection, 2000); // check every 2s
        }
      }, 200);
    } catch (err: any) {
      setStatus(`❌ Camera: ${err.message}`);
    }
  };

  // Reset matched state when targetAction changes (new page)
  useEffect(() => {
    matchedRef.current = false;
    setMatched(false);
  }, [targetAction]);

  if (!targetAction) return null; // only show when there's an action to detect

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {/* Match banner */}
      {matched && (
        <div className="bg-yellow-400 text-white text-sm font-bold px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1 animate-bounce">
          <Star className="w-4 h-4 fill-white" />
          {targetLabel ?? targetAction?.replace('_', ' ')}! ⭐
        </div>
      )}

      {/* Prompt */}
      {!matched && (
        <div className="bg-blue-100 border border-blue-300 text-blue-700 text-xs px-2 py-1 rounded-xl">
          Try it: <strong>{targetLabel ?? targetAction?.replace('_', ' ')}</strong> 📷
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-xl max-w-52">
          {status}
        </div>
      )}

      {/* Camera preview */}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-24 h-18 ${showCamera ? 'block' : 'hidden'}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>

      {/* Detect now */}
      {isActive && (
        <button onClick={runDetection} title="Check now" className="p-2 rounded-full shadow-lg bg-yellow-400 text-white hover:bg-yellow-500">
          <Zap className="w-4 h-4" />
        </button>
      )}

      {/* Toggle */}
      <button
        onClick={handleToggle}
        title={isActive ? 'Stop' : 'Start action detection'}
        className={`p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-blue-50'}`}
      >
        {isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>
    </div>
  );
}
