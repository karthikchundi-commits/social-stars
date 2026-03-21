'use client';

import { useState, useRef } from 'react';
import { Camera, Smile, Zap } from 'lucide-react';

interface EmotionDetectorProps {
  childId: string;
  activityId?: string;
  sessionId: string;
}

export function EmotionDetector({ childId, activityId, sessionId }: EmotionDetectorProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [status, setStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const emotionEmoji: Record<string, string> = {
    happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
    focused: '🧐', neutral: '😐', anxious: '😰',
  };

  const emotionColors: Record<string, string> = {
    happy: 'bg-yellow-100 border-yellow-300',
    sad: 'bg-blue-100 border-blue-300',
    confused: 'bg-orange-100 border-orange-300',
    frustrated: 'bg-red-100 border-red-300',
    focused: 'bg-green-100 border-green-300',
    neutral: 'bg-gray-100 border-gray-300',
    anxious: 'bg-purple-100 border-purple-300',
  };

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    if (!video) { setStatus('❌ No video element'); return; }
    if (video.videoWidth === 0) { setStatus('❌ Video not ready'); return; }

    setStatus('📸 Capturing...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setStatus('❌ Canvas error'); return; }
      ctx.drawImage(video, 0, 0, 320, 240);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      setStatus('🤖 Analyzing...');
      const response = await fetch('/api/emotion-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, sessionId, source: 'face', imageData }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(`❌ API error: ${data.error}`);
        return;
      }
      setCurrentEmotion(data.detectedEmotion ?? 'neutral');
      setStatus(`✅ ${data.detectedEmotion} (${Math.round((data.confidence ?? 0) * 100)}%)`);
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
      setStatus('');
      return;
    }

    setShowCamera(true);
    setStatus('🎥 Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      // Wait for next render so video element is visible, then attach stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setIsActive(true);
          setStatus('✅ Camera ready');
          // First capture after 2s, then every 15s
          setTimeout(captureAndAnalyze, 2000);
          intervalRef.current = setInterval(captureAndAnalyze, 15000);
        } else {
          setStatus('❌ Video ref missing');
        }
      }, 200);
    } catch (err: any) {
      setStatus(`❌ Camera: ${err.message}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Status/debug line */}
      {status && (
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-xl max-w-48 text-right">
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

      {/* Camera preview */}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-24 h-18 ${showCamera ? 'block' : 'hidden'}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>

      {/* Detect Now button */}
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
