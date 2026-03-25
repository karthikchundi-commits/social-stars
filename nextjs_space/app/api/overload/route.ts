// PC-07: Cognitive Overload Early Warning System
// Computes a real-time overload score from hesitation latency + error rate + difficulty trend.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  // Last 10 confusion events
  const events = await prisma.confusionEvent.findMany({
    where: { childId },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  const adaptation = await prisma.learningAdaptation.findUnique({ where: { childId } });

  if (events.length === 0) {
    return NextResponse.json({ score: 0, level: 'normal', recommendation: null });
  }

  // Signal 1: Wrong answer rate in last 10 events (0–1)
  const wrongRate = events.filter(e => e.eventType === 'wrong_answer').length / events.length;

  // Signal 2: Average hesitation normalised over 0–5000ms range (0–1)
  const hesitationEvents = events.filter(e => e.hesitationMs != null && e.hesitationMs > 0);
  const avgHesitation = hesitationEvents.length > 0
    ? hesitationEvents.reduce((sum, e) => sum + (e.hesitationMs ?? 0), 0) / hesitationEvents.length
    : 0;
  const hesitationScore = Math.min(1, avgHesitation / 5000);

  // Signal 3: Low difficulty level indicates struggling (inverted: low difficulty = high overload signal)
  const difficultySignal = adaptation ? Math.max(0, 0.5 - adaptation.difficultyLevel) * 2 : 0;

  // Composite overload score: weighted average
  const score = Math.min(1, wrongRate * 0.45 + hesitationScore * 0.35 + difficultySignal * 0.20);

  let level: 'normal' | 'elevated' | 'high';
  let recommendation: string | null = null;

  if (score >= 0.7) {
    level = 'high';
    recommendation = 'breathing'; // suggest switching to breathing activity
  } else if (score >= 0.45) {
    level = 'elevated';
    recommendation = 'reduce_difficulty';
  } else {
    level = 'normal';
  }

  return NextResponse.json({
    score: Math.round(score * 100) / 100,
    level,
    recommendation,
    signals: {
      wrongRate: Math.round(wrongRate * 100) / 100,
      avgHesitationMs: Math.round(avgHesitation),
      difficultyLevel: adaptation?.difficultyLevel ?? null,
    },
  });
}
