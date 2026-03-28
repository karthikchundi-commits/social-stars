'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { EMOTION_IMAGES } from '@/lib/constants';
import { useConfusionTracker } from '@/hooks/useConfusionTracker';
import { MultimodalDetector } from '@/components/MultimodalDetector';
import { CoachingHint } from '@/components/CoachingHint';

export default function EmotionActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coachingHint, setCoachingHint] = useState<{ hint: string; encouragement: string } | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  const emotions = [
    { id: 'happy', label: 'Happy', image: EMOTION_IMAGES.happy },
    { id: 'sad', label: 'Sad', image: EMOTION_IMAGES.sad },
    { id: 'angry', label: 'Angry', image: EMOTION_IMAGES.angry },
    { id: 'surprised', label: 'Surprised', image: EMOTION_IMAGES.surprised },
    { id: 'scared', label: 'Scared', image: EMOTION_IMAGES.scared },
    { id: 'excited', label: 'Excited', image: EMOTION_IMAGES.excited },
  ];

  const confusion = useConfusionTracker({ childId, activityId, activityType: 'emotion' });

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

  const fetchCoachingHint = useCallback(async (attemptCount: number) => {
    if (attemptCount < 2) return; // Only show hint after 2nd wrong answer
    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          activityType: 'emotion',
          activityTitle: activity?.title,
          question: `Find the ${activity?.category} face`,
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

  // Start hesitation timer when activity loads
  useEffect(() => {
    if (activity && !completed) {
      confusion.resetForNewQuestion();
      confusion.startHesitationTimer(
        `emotion:${activity?.category}`,
        () => fetchCoachingHint(1),
      );
    }
    return () => confusion.stopHesitationTimer();
  }, [activity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmotionSelect = async (emotionId: string) => {
    if (completed) return;

    confusion.stopHesitationTimer();
    setSelectedEmotion(emotionId);
    const correct = emotionId === activity?.category;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      playAudio('Great job! You got it right!');
      await confusion.trackCorrectAnswer(`emotion:${activity?.category}`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => markAsComplete(), 2000);
    } else {
      playAudio('Try again!');
      const attemptCount = await confusion.trackWrongAnswer(`emotion:${activity?.category}`);
      fetchCoachingHint(attemptCount);
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedEmotion(null);
        confusion.startHesitationTimer(`emotion:${activity?.category}`, () => fetchCoachingHint(confusion.getAttemptCount()));
      }, 1500);
    }
  };

  const markAsComplete = async () => {
    setCompleted(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, score: 100 }),
      });
      const data = await response.json();
      if (data?.achievement) playAudio(`Wow! You earned a new badge: ${data.achievement.title}`);
      setTimeout(() => router.push(`/dashboard/${childId}`), 3000);
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10" />
              {activity?.title ?? 'Emotion Game'}
            </h1>
            <p className="text-2xl text-gray-700 mb-6">{activity?.description ?? 'Find the emotion!'}</p>
            <button
              onClick={() => playAudio(`Can you find the ${activity?.category ?? 'emotion'}?`)}
              className="px-8 py-4 bg-blue-500 text-white font-bold text-xl rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-3 mx-auto"
            >
              <Volume2 className="w-6 h-6" />
              Play Instructions
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {emotions.map((emotion) => {
              const isSelected = selectedEmotion === emotion.id;
              const isThisCorrect = isCorrect && isSelected;
              const isThisWrong = !isCorrect && isSelected && showFeedback;
              return (
                <div key={emotion.id} className="relative">
                  <button
                    onClick={() => handleEmotionSelect(emotion.id)}
                    disabled={completed || showFeedback}
                    className={`child-card bg-white w-full ${isThisCorrect ? 'ring-8 ring-green-400' : ''} ${isThisWrong ? 'ring-8 ring-red-400' : ''} disabled:opacity-50`}
                  >
                    <div className="relative w-full aspect-square mb-4">
                      <Image src={emotion.image} alt={emotion.label} fill className="object-cover rounded-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{emotion.label}</h3>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(emotion.label); }}
                    className="absolute top-2 right-2 w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-all shadow-md"
                    aria-label={`Listen to ${emotion.label}`}
                  >
                    <Volume2 className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              );
            })}
          </div>

          {showFeedback && isCorrect && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-green-100 border-4 border-green-400 px-8 py-4 rounded-3xl">
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500 sparkle" />
                <span className="text-3xl font-bold text-green-700">Amazing! 🎉</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Coaching hint overlay */}
      {coachingHint && (
        <CoachingHint
          hint={coachingHint.hint}
          encouragement={coachingHint.encouragement}
          onDismiss={() => setCoachingHint(null)}
        />
      )}

      <MultimodalDetector
        childId={childId}
        activityId={activityId}
        sessionId={sessionId}
        targetEmotion={activity?.category}
        onEmotionMatch={() => {
          if (!completed) handleEmotionSelect(activity?.category);
        }}
      />
    </div>
  );
}
