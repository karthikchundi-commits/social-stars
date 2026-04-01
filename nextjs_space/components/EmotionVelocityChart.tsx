'use client';
// PC-08: Emotion Transition Velocity — therapist dashboard widget

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

interface VelocityData {
  transitions: { from: string; to: string; durationMs: number }[];
  velocityPerMinute: number;
  topTransition: string | null;
  stateProfile: Record<string, number>; // emotion → % of session time
  totalTransitions: number;
  sessionDurationMinutes: number;
  riskFlag: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#fbbf24',
  calm: '#34d399',
  excited: '#f97316',
  neutral: '#9ca3af',
  sad: '#60a5fa',
  anxious: '#f472b6',
  angry: '#ef4444',
  fearful: '#a78bfa',
  surprised: '#fb923c',
};

interface Props {
  childId: string;
}

export function EmotionVelocityChart({ childId }: Props) {
  const [data, setData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/emotion-velocity?childId=${childId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />;
  if (!data || data.totalTransitions === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No emotion session data yet
      </div>
    );
  }

  const stateEntries = Object.entries(data.stateProfile).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      {/* Velocity badge + risk flag */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
          data.riskFlag ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {data.riskFlag ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {data.velocityPerMinute} transitions/min
        </div>
        {data.riskFlag && (
          <span className="text-xs text-red-600 font-semibold">⚠ Rapid emotion cycling detected</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{data.totalTransitions} transitions · {data.sessionDurationMinutes} min</span>
      </div>

      {/* State profile bar */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">Time in each emotional state</p>
        <div className="flex rounded-lg overflow-hidden h-5">
          {stateEntries.map(([emotion, pct]) => (
            <div
              key={emotion}
              style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emotion] ?? '#9ca3af' }}
              title={`${emotion}: ${pct}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {stateEntries.map(([emotion, pct]) => (
            <span key={emotion} className="flex items-center gap-1 text-xs text-gray-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EMOTION_COLORS[emotion] ?? '#9ca3af' }} />
              {emotion} {pct}%
            </span>
          ))}
        </div>
      </div>

      {/* Most frequent transition */}
      {data.topTransition && (
        <p className="text-xs text-gray-500">
          Most common transition: <span className="font-semibold text-gray-700">{data.topTransition}</span>
        </p>
      )}
    </div>
  );
}
