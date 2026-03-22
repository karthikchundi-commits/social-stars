'use client';
import { ChevronRight, StopCircle } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onAdvance: () => void;
  onEnd: () => void;
  advancing: boolean;
}

export function HostControls({ currentPage, totalPages, onAdvance, onEnd, advancing }: Props) {
  const isLast = currentPage >= totalPages - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-3 flex items-center justify-between z-40 shadow-lg">
      <span className="text-sm font-semibold text-gray-500">
        Host controls · Page {currentPage + 1} / {totalPages}
      </span>
      <div className="flex items-center gap-3">
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
  );
}
