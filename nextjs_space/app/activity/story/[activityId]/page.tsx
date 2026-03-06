'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Volume2, Star } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { STORY_IMAGES } from '@/lib/constants';

interface StoryPage {
  text: string;
  image: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

export default function StoryActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    }
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

  const content = activity?.content ? JSON.parse(activity.content) : null;
  const pages: StoryPage[] = content?.pages ?? [];
  const page = pages[currentPage];

  const handleNext = () => {
    if (page?.question && selectedAnswer === null) {
      return;
    }

    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      markAsComplete();
    }
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowFeedback(true);

    if (index === page?.correctAnswer) {
      playAudio('Great job!');
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      playAudio('Try again!');
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const markAsComplete = async () => {
    setCompleted(true);
    playAudio('You finished the story! Great work!');
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
    });

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          activityId,
          score: 100,
        }),
      });

      setTimeout(() => {
        router.push(`/dashboard/${childId}`);
      }, 3000);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Story Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              {activity?.title ?? 'Story Time'}
            </h1>
            <p className="text-lg text-gray-600">
              Page {currentPage + 1} of {pages?.length ?? 0}
            </p>
          </div>

          {/* Story Image */}
          <div className="relative w-full h-80 mb-6 rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={page?.image ?? STORY_IMAGES.playground}
              alt="Story scene"
              fill
              className="object-cover"
            />
          </div>

          {/* Story Text */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
            <p className="text-2xl text-gray-800 leading-relaxed">
              {page?.text ?? ''}
            </p>
          </div>

          <button
            onClick={() => playAudio(page?.text ?? '')}
            className="mb-6 px-6 py-3 bg-blue-500 text-white font-bold text-lg rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 mx-auto"
          >
            <Volume2 className="w-5 h-5" />
            Read to Me
          </button>

          {/* Question */}
          {page?.question && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                {page?.question}
              </h3>
              <div className="space-y-3">
                {page?.options?.map?.((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === page?.correctAnswer;
                  const showCorrect = isSelected && showFeedback && isCorrect;
                  const showWrong = isSelected && showFeedback && !isCorrect;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                      className={`w-full text-xl font-semibold px-6 py-4 rounded-2xl transition-all ${
                        showCorrect ? 'bg-green-400 text-white' : ''
                      } ${
                        showWrong ? 'bg-red-400 text-white' : ''
                      } ${
                        !isSelected ? 'bg-purple-100 hover:bg-purple-200 text-gray-800' : ''
                      } disabled:opacity-70`}
                    >
                      {option}
                    </button>
                  );
                }) ?? null}
              </div>
            </div>
          )}

          {/* Navigation */}
          {!page?.question && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="child-button bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 flex items-center gap-3"
              >
                {currentPage < pages.length - 1 ? 'Next' : 'Finish'}
                {currentPage < pages.length - 1 ? (
                  <ArrowRight className="w-6 h-6" />
                ) : (
                  <Star className="w-6 h-6" />
                )}
              </button>
            </div>
          )}

          {completed && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 bg-yellow-100 border-4 border-yellow-400 px-8 py-4 rounded-3xl">
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500 sparkle" />
                <span className="text-3xl font-bold text-yellow-700">Story Complete! 🎉</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
