'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CoachingHintProps {
  hint: string;
  encouragement: string;
  onDismiss: () => void;
  autoSpeakMs?: number;
}

export function CoachingHint({ hint, encouragement, onDismiss, autoSpeakMs = 500 }: CoachingHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Auto-speak hint
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const timer = setTimeout(() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(hint + ' ' + encouragement);
        utterance.rate = 0.85;
        utterance.pitch = 1.3;
        window.speechSynthesis.speak(utterance);
      }, autoSpeakMs);
      return () => clearTimeout(timer);
    }
  }, [hint, encouragement, autoSpeakMs]);

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-purple-300 p-6 max-w-sm mx-auto">
        {/* Star character */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Hint text */}
        <p className="text-xl font-bold text-gray-800 text-center mb-2 leading-relaxed">
          {hint}
        </p>

        {/* Encouragement */}
        <p className="text-lg text-purple-600 font-semibold text-center mb-4">
          {encouragement}
        </p>

        {/* Dismiss button */}
        <button
          onClick={() => {
            window.speechSynthesis?.cancel?.();
            onDismiss();
          }}
          className="w-full py-3 bg-purple-500 text-white font-bold text-lg rounded-2xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
        >
          <span>OK, I'll try! 💪</span>
        </button>

        {/* Close X */}
        <button
          onClick={() => { window.speechSynthesis?.cancel?.(); onDismiss(); }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Speech bubble tail */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-purple-300" />
    </div>
  );
}
