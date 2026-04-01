'use client';
import { AnsweredPayload } from '@/lib/circleTime';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  answers: AnsweredPayload[];
  options: string[];
}

export function AnswerReveal({ answers, options }: Props) {
  if (answers.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Answers</p>
      {answers.map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-semibold ${
            a.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: a.avatarColor }}
          >
            {a.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1">
            <strong>{a.displayName}</strong>
            {' — '}
            {options[a.answerIndex] ?? `Option ${a.answerIndex + 1}`}
          </span>
          {a.isCorrect
            ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          }
        </div>
      ))}
    </div>
  );
}
