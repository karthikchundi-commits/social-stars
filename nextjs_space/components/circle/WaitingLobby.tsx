'use client';
import { CircleParticipant } from '@/lib/circleTime';
import { JoinCodeDisplay } from './JoinCodeDisplay';
import { ParticipantGrid } from './ParticipantGrid';
import { Users, Play } from 'lucide-react';

interface Props {
  joinCode: string;
  participants: CircleParticipant[];
  isHost: boolean;
  onStart: () => void;
  starting: boolean;
}

export function WaitingLobby({ joinCode, participants, isHost, onStart, starting }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-3xl font-black text-purple-700">Circle Time!</h1>
        <p className="text-gray-500 mt-1">
          {isHost ? 'Share the code below so friends can join' : 'Waiting for the host to start...'}
        </p>
      </div>

      <JoinCodeDisplay joinCode={joinCode} />

      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-gray-700">
            {participants.length} {participants.length === 1 ? 'person' : 'people'} here
          </span>
        </div>
        <ParticipantGrid participants={participants} />
      </div>

      {isHost && (
        <button
          onClick={onStart}
          disabled={starting}
          className="child-button bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 flex items-center gap-3 text-xl disabled:opacity-60"
        >
          <Play className="w-6 h-6" />
          {starting ? 'Starting...' : 'Start Circle Time!'}
        </button>
      )}

      {!isHost && (
        <div className="flex items-center gap-3 text-purple-500 animate-pulse">
          <div className="w-3 h-3 bg-purple-400 rounded-full" />
          <span className="font-semibold">Getting ready...</span>
        </div>
      )}
    </div>
  );
}
