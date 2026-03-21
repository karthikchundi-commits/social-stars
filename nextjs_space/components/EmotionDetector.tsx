'use client';

import { useState } from 'react';
import { Camera, Smile } from 'lucide-react';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';

interface EmotionDetectorProps {
  childId: string;
  activityId?: string;
  sessionId: string;
}

export function EmotionDetector({ childId, activityId, sessionId }: EmotionDetectorProps) {
  const [showCamera, setShowCamera] = useState(false);
  const { currentEmotion, emotionEmoji, isActive, videoRef, startDetection, stopDetection } = useEmotionDetection({
    childId, activityId, sessionId, enabled: false,
  });

  const handleToggle = async () => {
    if (isActive) {
      stopDetection();
      setShowCamera(false);
    } else {
      setShowCamera(true);
      await startDetection();
    }
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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Emotion display badge */}
      {isActive && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 shadow-lg ${emotionColors[currentEmotion] ?? 'bg-gray-100 border-gray-300'}`}>
          <span className="text-2xl">{emotionEmoji}</span>
          <span className="text-sm font-semibold text-gray-700 capitalize">{currentEmotion}</span>
        </div>
      )}

      {/* Camera preview — always mounted so videoRef is available when stream starts */}
      <div className={`rounded-2xl overflow-hidden shadow-xl border-4 border-white w-20 h-16 ${showCamera ? 'block' : 'hidden'}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        title={isActive ? 'Turn off emotion detection' : 'Turn on emotion detection'}
        className={`p-3 rounded-full shadow-lg transition-all ${
          isActive ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-purple-50'
        }`}
      >
        {isActive ? <Camera className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
      </button>
    </div>
  );
}
