'use client';
import { useState } from 'react';
import { ChevronRight, StopCircle, Zap } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  type: string;
}

interface Props {
  currentPage: number;
  totalPages: number;
  onAdvance: () => void;
  onEnd: () => void;
  advancing: boolean;
  // PC-13: activity push
  sessionId: string;
  participantId: string;
  activities?: Activity[];
}

export function HostControls({ currentPage, totalPages, onAdvance, onEnd, advancing, sessionId, participantId, activities = [] }: Props) {
  const isLast = currentPage >= totalPages - 1;
  const [showPicker, setShowPicker] = useState(false);
  const [pushing, setPushing] = useState(false);

  const handlePush = async (activityId: string) => {
    setPushing(true);
    setShowPicker(false);
    try {
      await fetch(`/api/circle/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push-activity', participantId, activityId }),
      });
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      {/* PC-13: Activity picker overlay */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Push Activity to All Participants</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activities.map(a => (
                <button
                  key={a.id}
                  onClick={() => handlePush(a.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                  <span className="font-semibold text-gray-800">{a.title}</span>
                  <span className="ml-2 text-xs text-gray-400 capitalize">{a.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-3 flex items-center justify-between z-40 shadow-lg">
        <span className="text-sm font-semibold text-gray-500">
          Host controls · Page {currentPage + 1} / {totalPages}
        </span>
        <div className="flex items-center gap-3">
          {/* PC-13: Push activity button */}
          <button
            onClick={() => setShowPicker(true)}
            disabled={pushing}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-200 transition-all text-sm disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {pushing ? 'Pushing…' : 'Push Activity'}
          </button>
          <button
            onClick={onEnd}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all text-sm"
          >
            <StopCircle className="w-4 h-4" />
            End Session
          </button>
          <button
            onClick={onAdvance}
            disabled={advancing || isLast}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {isLast ? 'Finish' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
