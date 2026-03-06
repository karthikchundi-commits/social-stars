'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BreathingPhase {
  label: string;
  duration: number;
  color: string;
  expand: boolean;
}

interface BreathingContent {
  phases: BreathingPhase[];
  cycles: number;
  instruction: string;
}

export default function BreathingActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params?.activityId as string;
  const childId = searchParams?.get('childId') ?? '';

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [countdown, setCountdown] = useState(4);
  const [circleScale, setCircleScale] = useState(0.8);
  const [circleColor, setCircleColor] = useState('#60B5FF');
  const [phaseDuration, setPhaseDuration] = useState(4);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(0);
  const cycleRef = useRef(1);
  const countdownRef = useRef(4);

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
      utterance.rate = 0.75;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getContent = (): BreathingContent | null => {
    if (!activity?.content) return null;
    try {
      return JSON.parse(activity.content);
    } catch {
      return null;
    }
  };

  const markAsComplete = useCallback(async () => {
    setIsComplete(true);
    setIsRunning(false);
    playAudio('Amazing! You did it! You are so calm and wonderful!');
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
    }, 4000);
  }, [childId, activityId, router]);

  const startBreathing = useCallback(() => {
    const content = getContent();
    if (!content) return;

    const { phases, cycles } = content;
    phaseRef.current = 0;
    cycleRef.current = 1;
    countdownRef.current = phases[0].duration;

    setPhaseIndex(0);
    setCycle(1);
    setCountdown(phases[0].duration);
    setCircleColor(phases[0].color);
    setPhaseDuration(phases[0].duration);
    setCircleScale(phases[0].expand ? 1.6 : 0.7);
    setIsRunning(true);

    playAudio(phases[0].label);

    intervalRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        // Move to next phase
        const nextPhase = (phaseRef.current + 1) % phases.length;
        const isNewCycle = nextPhase === 0;
        const nextCycle = isNewCycle ? cycleRef.current + 1 : cycleRef.current;

        if (isNewCycle && cycleRef.current >= cycles) {
          // All cycles done
          clearInterval(intervalRef.current!);
          markAsComplete();
          return;
        }

        phaseRef.current = nextPhase;
        cycleRef.current = nextCycle;
        countdownRef.current = phases[nextPhase].duration;

        setPhaseIndex(nextPhase);
        setCycle(nextCycle);
        setCountdown(phases[nextPhase].duration);
        setCircleColor(phases[nextPhase].color);
        setPhaseDuration(phases[nextPhase].duration);
        setCircleScale(phases[nextPhase].expand ? 1.6 : 0.7);
        playAudio(phases[nextPhase].label);
      }
    }, 1000);
  }, [activity, markAsComplete]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-teal-600">Loading...</div>
      </div>
    );
  }

  const content = getContent();
  const currentPhase = content?.phases[phaseIndex];
  const totalCycles = content?.cycles ?? 3;

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 50%, #e3f2fd 100%)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-teal-600 mb-2">
            {activity?.title ?? 'Breathing Exercise'}
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            {!isRunning && !isComplete ? (content?.instruction ?? 'Let\'s breathe together to feel calm') : ''}
          </p>

          {/* Breathing Circle */}
          <div className="flex items-center justify-center mb-8" style={{ height: '280px' }}>
            <div
              className="rounded-full flex items-center justify-center shadow-2xl"
              style={{
                width: '160px',
                height: '160px',
                backgroundColor: isRunning ? circleColor : '#e0f7fa',
                transform: `scale(${isRunning ? circleScale : 1})`,
                transition: isRunning ? `transform ${phaseDuration}s ease-in-out, background-color 0.5s ease` : 'none',
              }}
            >
              {isRunning && (
                <div className="text-white text-center">
                  <div className="text-5xl font-bold">{countdown}</div>
                  <div className="text-sm font-semibold mt-1 opacity-90">{currentPhase?.label}</div>
                </div>
              )}
              {!isRunning && !isComplete && (
                <div className="text-teal-400 text-center">
                  <div className="text-lg font-semibold">Ready?</div>
                </div>
              )}
              {isComplete && (
                <div className="text-white text-center" style={{ backgroundColor: '#4CAF50', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star className="w-16 h-16 fill-yellow-300 text-yellow-300" />
                </div>
              )}
            </div>
          </div>

          {/* Phase Label */}
          {isRunning && (
            <div className="mb-6">
              <div
                className="inline-block px-8 py-3 rounded-full text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: circleColor }}
              >
                {currentPhase?.label}
              </div>
            </div>
          )}

          {/* Cycle Progress */}
          {isRunning && (
            <div className="flex justify-center gap-3 mb-6">
              {Array.from({ length: totalCycles }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i < cycle ? circleColor : '#e0e0e0' }}
                />
              ))}
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="mb-6">
              <div className="bg-green-100 border-4 border-green-400 rounded-3xl px-8 py-4 inline-block">
                <p className="text-3xl font-bold text-green-700">You did it! So calm!</p>
              </div>
            </div>
          )}

          {/* Start Button */}
          {!isRunning && !isComplete && (
            <button
              onClick={startBreathing}
              className="child-button bg-gradient-to-r from-teal-400 to-blue-500 text-white px-12 flex items-center gap-3 mx-auto"
            >
              <Play className="w-8 h-8" />
              Start Breathing
            </button>
          )}
        </div>

        {/* Phase Guide */}
        {!isRunning && !isComplete && content && (
          <div className="mt-6 bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">What we'll do ({totalCycles} rounds):</h3>
            <div className="grid grid-cols-2 gap-3">
              {content.phases.map((phase, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ backgroundColor: phase.color + '22', borderLeft: `4px solid ${phase.color}` }}
                >
                  <span className="text-2xl">{phase.expand ? '🌬️' : '😌'}</span>
                  <div>
                    <div className="font-bold text-gray-800">{phase.label}</div>
                    <div className="text-sm text-gray-500">{phase.duration} seconds</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
