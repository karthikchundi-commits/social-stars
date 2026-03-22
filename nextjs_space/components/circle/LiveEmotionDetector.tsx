'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Smile } from 'lucide-react';

const FACE_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const EXPRESSION_MAP: Record<string, string> = {
  happy: 'happy', sad: 'sad', angry: 'frustrated',
  fearful: 'scared', disgusted: 'frustrated',
  surprised: 'surprised', neutral: 'neutral',
};

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
  neutral: '😐', surprised: '😲', scared: '😨',
};

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-100 border-yellow-300',
  sad: 'bg-blue-100 border-blue-300',
  frustrated: 'bg-red-100 border-red-300',
  neutral: 'bg-gray-100 border-gray-300',
  surprised: 'bg-pink-100 border-pink-300',
  scared: 'bg-indigo-100 border-indigo-300',
};

interface Props {
  sessionId: string;
  participantId: string;
  onEmotionChange?: (emotion: string) => void;
}

export function LiveEmotionDetector({ sessionId, participantId, onEmotionChange }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [status, setStatus] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceApiRef = useRef<any>(null);
  const modelsReadyRef = useRef(false);

  const onEmotionChangeRef = useRef(onEmotionChange);
  useRef(() => { onEmotionChangeRef.current = onEmotionChange; });

  const broadcastEmotion = useCallback(async (emotion: string) => {
    try {
      await fetch(`/api/circle/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emotion', participantId, emotion }),
      });
    } catch {}
  }, [sessionId, participantId]);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const faceapi = faceApiRef.current;
    if (!video || !faceapi || video.videoWidth === 0) return;
    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (!detections?.length) return;
      const expressions = detections[0].expressions as Record<string, number>;
      const [topExpr] = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotion = EXPRESSION_MAP[topExpr] ?? 'neutral';
      setCurrentEmotion(emotion);
      onEmotionChangeRef.current?.(emotion);
      broadcastEmotion(emotion);
    } catch {}
  }, [broadcastEmotion]);

  const loadModels = async (): Promise<boolean> => {
    if (modelsReadyRef.current) return true;
    setStatus('⏳ Loading...');
    try {
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(FACE_MODEL_URL),
      ]);
      faceApiRef.current = faceapi;
      modelsReadyRef.current = true;
      setStatus('✅ Ready');
      return true;
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
      return false;
    }
  };

  const handleToggle = async () => {
    if (isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsActive(false); setShowCamera(false); setStatus('');
      return;
    }
    const ready = await loadModels();
    if (!ready) return;
    setShowCamera(true);
    setStatus('🎥 Starting...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsActive(true);
        setStatus('🔍 Detecting...');
        intervalRef.current = setInterval(runDetection, 5000);
        setTimeout(runDetection, 1500);
      }, 200);
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {status && (
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-xl">{status}</div>
      )}
      {isActive && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 shadow-lg ${EMOTION_COLORS[currentEmotion] ?? 'bg-gray-100 border-gray-300'}`}>
          <span className="text-2xl">{EMOTION_EMOJI[currentEmotion] ?? '😐'}</span>
          <span className="text-sm font-semibold text-gray-700 capitalize">{currentEmotion}</span>
        </div>
      )}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-24 ${showCamera ? 'block' : 'hidden'}`} style={{ height: '72px' }}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>
      <button
        onClick={handleToggle}
        title={isActive ? 'Turn off camera' : 'Turn on camera'}
        className={`p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-purple-50'}`}
      >
        {isActive ? <Camera className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
      </button>
    </div>
  );
}
