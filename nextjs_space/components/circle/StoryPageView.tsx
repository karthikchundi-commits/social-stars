'use client';
import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { AnswerReveal } from './AnswerReveal';
import { AnsweredPayload } from '@/lib/circleTime';

interface StoryPage {
  text: string;
  image: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

interface Props {
  page: StoryPage;
  pageIndex: number;
  totalPages: number;
  myAnswer: number | null;
  onAnswer: (index: number) => void;
  answers: AnsweredPayload[];
  disabled: boolean;
}

const speak = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1.2;
    window.speechSynthesis.speak(u);
  }
};

export function StoryPageView({ page, pageIndex, totalPages, myAnswer, onAnswer, answers, disabled }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6">
      <div className="text-center mb-4">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Page {pageIndex + 1} of {totalPages}
        </span>
      </div>

      <div className="relative w-full h-56 mb-5 rounded-2xl overflow-hidden bg-gray-100">
        <Image src={page.image} alt="Story scene" fill className="object-cover" />
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 mb-4">
        <p className="text-xl text-gray-800 leading-relaxed">{page.text}</p>
      </div>

      <button
        onClick={() => speak(page.text)}
        className="mb-4 px-5 py-2 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 mx-auto text-sm"
      >
        <Volume2 className="w-4 h-4" />
        Read to Me
      </button>

      {page.question && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-3">{page.question}</h3>
          <div className="space-y-2">
            {page.options?.map((option, index) => {
              const isSelected = myAnswer === index;
              const isCorrect = index === page.correctAnswer;
              const showResult = myAnswer !== null;
              return (
                <button
                  key={index}
                  onClick={() => onAnswer(index)}
                  disabled={disabled || myAnswer !== null}
                  className={`w-full text-left text-base font-semibold px-5 py-3 rounded-2xl transition-all
                    ${showResult && isCorrect ? 'bg-green-400 text-white' : ''}
                    ${showResult && isSelected && !isCorrect ? 'bg-red-400 text-white' : ''}
                    ${!showResult || (!isSelected && !isCorrect) ? 'bg-purple-100 hover:bg-purple-200 text-gray-800' : ''}
                    disabled:opacity-70 cursor-pointer`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <AnswerReveal answers={answers} options={page.options ?? []} />
        </div>
      )}
    </div>
  );
}
