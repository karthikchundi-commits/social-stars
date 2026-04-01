'use client';
import { CircleParticipant, EMOTION_EMOJI } from '@/lib/circleTime';
import { Crown } from 'lucide-react';

interface Props {
  participants: CircleParticipant[];
}

export function ParticipantGrid({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No one has joined yet...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {participants.map(p => (
        <div
          key={p.id}
          className="flex flex-col items-center gap-1 bg-white rounded-2xl shadow-md p-3 w-24 border-2"
          style={{ borderColor: p.avatarColor }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold relative"
            style={{ backgroundColor: p.avatarColor }}
          >
            {p.displayName.charAt(0).toUpperCase()}
            {p.isHost && (
              <Crown className="w-4 h-4 text-yellow-400 absolute -top-2 -right-1" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-700 truncate w-full text-center">
            {p.displayName}
          </span>
          <span className="text-2xl" title={p.currentEmotion}>
            {EMOTION_EMOJI[p.currentEmotion] ?? '😐'}
          </span>
        </div>
      ))}
    </div>
  );
}
