'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Star, CheckCircle, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Option {
  text: string;
  isCorrect: boolean;
  feedback: string;
  resultEmoji: string;
}

interface Turn {
  prompt: string;
  options: Option[];
}

interface SocialCoachContent {
  scenario: string;
  characterName: string;
  characterEmoji: string;
  turns: Turn[];
}

export default function SocialCoachPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [content, setContent] = useState<SocialCoachContent | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activityId) fetchActivity();
  }, [activityId]);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/activities');
      const data = await response.json();
      const found = data?.activities?.find((a: any) => a?.id === activityId);
      if (found) {
        setActivity(found);
        setContent(JSON.parse(found.content));
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9;
      utt.pitch = 1.2;
      window.speechSynthesis.speak(utt);
    }
  };

  const handleSelect = (optionIndex: number) => {
    if (showFeedback || completed) return;
    const option = content!.turns[currentTurn].options[optionIndex];
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    if (option.isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      speak('Great choice! ' + option.feedback);
    } else {
      speak(option.feedback);
    }
  };

  const handleNext = () => {
    const nextTurn = currentTurn + 1;
    if (nextTurn >= (content?.turns.length ?? 0)) {
      markComplete();
    } else {
      setCurrentTurn(nextTurn);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const markComplete = async () => {
    setCompleted(true);
    const totalTurns = content?.turns.length ?? 1;
    const pct = Math.round((score / totalTurns) * 100);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, score: pct }),
      });
    } catch (err) {
      console.error('Error marking complete:', err);
    }
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    setTimeout(() => router.push(`/dashboard/${childId}`), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Activity not found</div>
      </div>
    );
  }

  const turn = content.turns[currentTurn];
  const totalTurns = content.turns.length;
  const selectedOpt = selectedOption !== null ? turn.options[selectedOption] : null;

  if (completed) {
    const pct = Math.round((score / totalTurns) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
          <div className="text-8xl mb-6">🌟</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-3">Amazing job!</h1>
          <p className="text-2xl text-gray-700 mb-4">
            You got <span className="font-bold text-green-600">{score}</span> out of{' '}
            <span className="font-bold">{totalTurns}</span> right!
          </p>
          <div className="text-6xl mb-4">{pct >= 70 ? '🏆' : '💪'}</div>
          <p className="text-gray-500 text-lg">Going back to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" /> {activity?.title ?? 'Social Coach'}
            </h1>
            <div className="flex items-center gap-1 text-yellow-500 font-bold">
              <Star className="w-5 h-5" fill="currentColor" />
              <span>{score}/{totalTurns}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all"
              style={{ width: `${((currentTurn) / totalTurns) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Situation {currentTurn + 1} of {totalTurns}</p>
        </div>

        {/* Scenario context */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 mb-4 border-2 border-purple-100">
          <p className="text-lg text-gray-700 leading-relaxed">{content.scenario}</p>
        </div>

        {/* Character speech bubble */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center text-4xl flex-shrink-0 shadow-md">
              {showFeedback && selectedOpt ? selectedOpt.resultEmoji : content.characterEmoji}
            </div>
            <div>
              <p className="text-sm font-bold text-purple-600 mb-1">{content.characterName} says:</p>
              <div className="bg-purple-50 rounded-2xl rounded-tl-none px-5 py-4">
                <p className="text-xl text-gray-800 leading-relaxed">{turn.prompt}</p>
              </div>
              <button
                onClick={() => speak(`${content.characterName} says: ${turn.prompt}`)}
                className="mt-2 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 font-semibold"
              >
                <Volume2 className="w-4 h-4" /> Listen
              </button>
            </div>
          </div>
        </div>

        {/* Feedback bubble */}
        {showFeedback && selectedOpt && (
          <div
            className={`rounded-3xl p-5 mb-4 border-2 ${
              selectedOpt.isCorrect
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'bg-orange-50 border-orange-300 text-orange-800'
            }`}
          >
            <p className="text-lg font-bold">{selectedOpt.isCorrect ? '⭐ ' : '💭 '}{selectedOpt.feedback}</p>
          </div>
        )}

        {/* Options */}
        {!showFeedback && (
          <div className="space-y-3">
            <p className="text-center text-gray-600 font-semibold mb-2">What do you do?</p>
            {turn.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="w-full child-button text-left px-6 bg-gradient-to-r from-purple-400 to-pink-400 text-white"
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Next button */}
        {showFeedback && (
          <button
            onClick={handleNext}
            className="w-full mt-4 py-4 bg-gradient-to-r from-green-400 to-teal-500 text-white text-xl font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {currentTurn + 1 >= totalTurns ? '🎉 Finish!' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
