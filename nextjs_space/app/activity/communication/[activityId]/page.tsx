'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Star, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommItem {
  label: string;
  emoji: string;
  audio: string;
}

interface CommContent {
  instruction: string;
  targetTaps: number;
  items: CommItem[];
}

export default function CommunicationActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tappedItems, setTappedItems] = useState<Set<number>>(new Set());
  const [lastTapped, setLastTapped] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (activityId) {
      fetch('/api/activities')
        .then((r) => r.json())
        .then((data) => {
          const found = data?.activities?.find((a: any) => a?.id === activityId);
          setActivity(found ?? null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activityId]);

  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getContent = (): CommContent | null => {
    if (!activity?.content) return null;
    try {
      return JSON.parse(activity.content);
    } catch {
      return null;
    }
  };

  const handleTap = async (index: number, item: CommItem) => {
    if (completed) return;

    playAudio(item.audio);
    setLastTapped(index);

    const newTapped = new Set(tappedItems);
    newTapped.add(index);
    setTappedItems(newTapped);

    const content = getContent();
    const target = content?.targetTaps ?? 5;

    if (newTapped.size >= target) {
      setTimeout(() => {
        markAsComplete();
      }, 800);
    }

    // Clear the "just tapped" highlight after a moment
    setTimeout(() => {
      setLastTapped((prev) => (prev === index ? null : prev));
    }, 1500);
  };

  const markAsComplete = async () => {
    setCompleted(true);
    playAudio('Wonderful talking! You are amazing!');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId, score: 100 }),
      });
    } catch (error) {
      console.error('Error marking complete:', error);
    }

    setTimeout(() => {
      router.push(`/dashboard/${childId}`);
    }, 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const content = getContent();
  const items = content?.items ?? [];
  const targetTaps = content?.targetTaps ?? 5;
  const progress = Math.min(tappedItems.size, targetTaps);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              {activity?.title ?? 'Communication Board'}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              {content?.instruction ?? 'Tap a picture to say how you feel!'}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3 justify-center mb-2">
              <span className="text-lg font-semibold text-gray-600">Progress:</span>
              <div className="flex gap-2">
                {Array.from({ length: targetTaps }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: i < progress ? '#9B59B6' : '#e0e0e0',
                    }}
                  >
                    {i < progress && <Star className="w-5 h-5 text-white fill-white" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Communication Board Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {items.map((item, index) => {
              const isTapped = tappedItems.has(index);
              const isJustTapped = lastTapped === index;

              return (
                <button
                  key={index}
                  onClick={() => handleTap(index, item)}
                  disabled={completed}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all duration-200 min-h-[120px] shadow-md
                    ${isJustTapped
                      ? 'border-yellow-400 bg-yellow-50 scale-110 shadow-xl'
                      : isTapped
                      ? 'border-purple-400 bg-purple-50 scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 hover:scale-105'
                    }
                    disabled:opacity-70`}
                >
                  {isTapped && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    </div>
                  )}
                  <span className="text-5xl mb-2" role="img" aria-label={item.label}>
                    {item.emoji}
                  </span>
                  <span className="text-sm font-bold text-gray-700 text-center leading-tight">
                    {item.label}
                  </span>
                  <Volume2 className="w-4 h-4 text-gray-400 mt-1" />
                </button>
              );
            })}
          </div>

          {/* Completion Banner */}
          {completed && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-yellow-100 border-4 border-yellow-400 px-8 py-4 rounded-3xl">
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500 sparkle" />
                <span className="text-3xl font-bold text-yellow-700">Great Talking!</span>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        {!completed && (
          <div className="mt-4 text-center text-gray-500 text-lg">
            Tap {targetTaps - progress} more picture{targetTaps - progress !== 1 ? 's' : ''} to finish!
          </div>
        )}
      </div>
    </div>
  );
}
