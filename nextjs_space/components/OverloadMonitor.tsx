'use client';
// PC-07: Cognitive Overload Early Warning System
// Polls the overload API during activity sessions and shows an intervention prompt when triggered.

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  childId: string;
  activityType: string;
  pollingIntervalMs?: number; // default 30s
}

interface OverloadData {
  score: number;
  level: 'normal' | 'elevated' | 'high';
  recommendation: 'breathing' | 'reduce_difficulty' | null;
}

export function OverloadMonitor({ childId, activityType, pollingIntervalMs = 30000 }: Props) {
  const router = useRouter();
  const [overload, setOverload] = useState<OverloadData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(() => {
    fetch(`/api/overload?childId=${childId}`)
      .then(r => r.json())
      .then((d: OverloadData) => {
        setOverload(d);
        if (d.level !== 'high') setDismissed(false); // reset dismiss when load drops
      })
      .catch(() => {});
  }, [childId]);

  useEffect(() => {
    // Don't monitor if already on a breathing activity
    if (activityType === 'breathing') return;
    check();
    const interval = setInterval(check, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [check, activityType, pollingIntervalMs]);

  if (!overload || overload.level !== 'high' || dismissed) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in-95">
        <div className="text-6xl mb-4">😮‍💨</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Time for a Break!</h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          It looks like things are getting a bit tricky. Let's take a quick breathing break before continuing!
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(`/activity/breathing/breathing-1?childId=${childId}`)}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-colors text-lg"
          >
            🫁 Do a Breathing Exercise
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
