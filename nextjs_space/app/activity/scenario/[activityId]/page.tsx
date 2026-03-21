'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Star, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { SCENARIO_IMAGES } from '@/lib/constants';
import { useConfusionTracker } from '@/hooks/useConfusionTracker';
import { MultimodalDetector } from '@/components/MultimodalDetector';
import { CoachingHint } from '@/components/CoachingHint';

interface Choice {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export default function ScenarioActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coachingHint, setCoachingHint] = useState<{ hint: string; encouragement: string } | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  const confusion = useConfusionTracker({ childId, activityId, activityType: 'scenario' });

  useEffect(() => {
    if (activityId) fetchActivity();
  }, [activityId]);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/activities');
      const data = await response.json();
      const currentActivity = data?.activities?.find?.((a: any) => a?.id === activityId);
      setActivity(currentActivity ?? null);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getScenarioImage = () => {
    const category = activity?.category ?? '';
    switch (category) {
      case 'greeting': return SCENARIO_IMAGES.greeting;
      case 'sharing': return SCENARIO_IMAGES.sharing;
      case 'helping': return SCENARIO_IMAGES.helping;
      case 'takingTurns': return SCENARIO_IMAGES.takingTurns;
      default: return SCENARIO_IMAGES.greeting;
    }
  };

  const fetchCoachingHint = useCallback(async (attemptCount: number) => {
    if (attemptCount < 2) return;
    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          activityType: 'scenario',
          activityTitle: activity?.title,
          question: activity?.description,
          wrongAnswers: attemptCount,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCoachingHint({ hint: data.hint, encouragement: data.encouragement });
      }
    } catch (error) {
      // Silent fail
    }
  }, [childId, activity]);

  useEffect(() => {
    if (activity && !completed) {
      confusion.resetForNewQuestion();
      confusion.startHesitationTimer(
        `scenario:${activity?.category}`,
        () => fetchCoachingHint(1),
      );
    }
    return () => confusion.stopHesitationTimer();
  }, [activity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoiceSelect = async (index: number, choice: Choice) => {
    if (completed || showFeedback) return;

    confusion.stopHesitationTimer();
    setSelectedChoice(index);
    setShowFeedback(true);

    if (choice?.isCorrect) {
      playAudio('Excellent! ' + (choice?.feedback ?? ''));
      await confusion.trackCorrectAnswer(`scenario:${activity?.category}`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => markAsComplete(), 2500);
    } else {
      playAudio('Think about it. ' + (choice?.feedback ?? ''));
      const attemptCount = await confusion.trackWrongAnswer(`scenario:${activity?.category}`);
      fetchCoachingHint(attemptCount);
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedChoice(null);
        confusion.startHesitationTimer(`scenario:${activity?.category}`, () => fetchCoachingHint(confusion.getAttemptCount()));
      }, 2500);
    }
  };

  const markAsComplete = async () => {
    setCompleted(true);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, score: 100 }),
      });
      setTimeout(() => router.push(`/dashboard/${childId}`), 2000);
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const content = activity?.content ? JSON.parse(activity.content) : null;
  const choices: Choice[] = content?.choices ?? [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-purple-600 mb-4">{activity?.title ?? 'Social Scenario'}</h1>
          </div>

          <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden">
            <Image src={getScenarioImage()} alt="Scenario" fill className="object-cover" />
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <p className="text-2xl text-gray-800 leading-relaxed">{activity?.description ?? ''}</p>
          </div>

          <button
            onClick={() => playAudio(activity?.description ?? '')}
            className="mb-8 px-6 py-3 bg-blue-500 text-white font-bold text-lg rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 mx-auto"
          >
            <Volume2 className="w-5 h-5" />
            Listen
          </button>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">What should you do?</h2>
            {choices?.map?.((choice, index) => {
              const isSelected = selectedChoice === index;
              const isCorrect = choice?.isCorrect ?? false;
              const showCorrect = isSelected && showFeedback && isCorrect;
              const showWrong = isSelected && showFeedback && !isCorrect;
              return (
                <button
                  key={index}
                  onClick={() => handleChoiceSelect(index, choice)}
                  disabled={completed || showFeedback}
                  className={`w-full child-button text-left px-8 ${showCorrect ? 'bg-green-400 text-white' : ''} ${showWrong ? 'bg-red-400 text-white' : ''} ${!isSelected ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' : ''} disabled:opacity-70`}
                >
                  <div className="flex items-center justify-between">
                    <span>{choice?.text ?? ''}</span>
                    {showCorrect && <CheckCircle className="w-8 h-8" />}
                  </div>
                </button>
              );
            }) ?? null}
          </div>

          {showFeedback && selectedChoice !== null && (
            <div className="mt-6 text-center">
              <div className={`inline-block px-8 py-4 rounded-3xl ${choices[selectedChoice]?.isCorrect ? 'bg-green-100 border-4 border-green-400 text-green-700' : 'bg-orange-100 border-4 border-orange-400 text-orange-700'}`}>
                <p className="text-xl font-bold">{choices[selectedChoice]?.feedback ?? ''}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {coachingHint && (
        <CoachingHint
          hint={coachingHint.hint}
          encouragement={coachingHint.encouragement}
          onDismiss={() => setCoachingHint(null)}
        />
      )}

      <MultimodalDetector childId={childId} activityId={activityId} sessionId={sessionId} />
    </div>
  );
}
