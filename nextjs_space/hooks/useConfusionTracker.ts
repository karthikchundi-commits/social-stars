import { useRef, useCallback } from 'react';

interface ConfusionTrackerOptions {
  childId: string;
  activityId: string;
  activityType: string;
}

export function useConfusionTracker({ childId, activityId, activityType }: ConfusionTrackerOptions) {
  const questionStartRef = useRef<number>(Date.now());
  const attemptRef = useRef<number>(1);
  const hesitationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasHesitatedRef = useRef<boolean>(false);

  const resetForNewQuestion = useCallback(() => {
    questionStartRef.current = Date.now();
    attemptRef.current = 1;
    hasHesitatedRef.current = false;
    if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
  }, []);

  const startHesitationTimer = useCallback((questionCtx?: string, onHesitation?: () => void) => {
    if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    hasHesitatedRef.current = false;

    hesitationTimerRef.current = setTimeout(async () => {
      if (hasHesitatedRef.current) return;
      hasHesitatedRef.current = true;
      const hesitationMs = Date.now() - questionStartRef.current;

      await fetch('/api/confusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId, activityId, activityType,
          eventType: 'hesitation',
          hesitationMs,
          attemptNumber: attemptRef.current,
          questionCtx,
        }),
      }).catch(() => {});

      onHesitation?.();
    }, 12000); // 12 seconds of no answer = hesitation
  }, [childId, activityId, activityType]);

  const stopHesitationTimer = useCallback(() => {
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
  }, []);

  const trackWrongAnswer = useCallback(async (questionCtx?: string) => {
    stopHesitationTimer();
    const hesitationMs = Date.now() - questionStartRef.current;

    await fetch('/api/confusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId, activityId, activityType,
        eventType: 'wrong_answer',
        hesitationMs,
        attemptNumber: attemptRef.current,
        questionCtx,
      }),
    }).catch(() => {});

    attemptRef.current++;
    // Restart timer for next attempt
    startHesitationTimer(questionCtx);

    return attemptRef.current - 1; // return current attempt count
  }, [childId, activityId, activityType, stopHesitationTimer, startHesitationTimer]);

  const trackCorrectAnswer = useCallback(async (questionCtx?: string) => {
    stopHesitationTimer();
    // On success, report to adaptive endpoint
    await fetch('/api/adaptive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        sessionData: { activityType, correct: 1, total: attemptRef.current, hesitationMs: Date.now() - questionStartRef.current },
      }),
    }).catch(() => {});
  }, [childId, activityType, stopHesitationTimer]);

  const getAttemptCount = useCallback(() => attemptRef.current, []);

  return {
    resetForNewQuestion,
    startHesitationTimer,
    stopHesitationTimer,
    trackWrongAnswer,
    trackCorrectAnswer,
    getAttemptCount,
  };
}
