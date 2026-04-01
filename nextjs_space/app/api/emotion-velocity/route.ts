// PC-08: Emotion Transition Velocity Profiling
// Analyses how quickly a child moves between emotional states within a session — a distinct clinical signal.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  const sessionId = searchParams.get('sessionId'); // optional — filter to one session
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const events = await prisma.emotionDetectionEvent.findMany({
    where: {
      childId,
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { timestamp: 'asc' },
    take: 200,
  });

  if (events.length < 2) {
    return NextResponse.json({ transitions: [], velocityPerMinute: 0, topTransition: null, stateProfile: {} });
  }

  // Compute state transitions
  const transitions: { from: string; to: string; durationMs: number }[] = [];
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];
    if (prev.detectedEmotion !== curr.detectedEmotion) {
      transitions.push({
        from: prev.detectedEmotion,
        to: curr.detectedEmotion,
        durationMs: new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime(),
      });
    }
  }

  // Velocity: transitions per minute
  const totalMs = new Date(events[events.length - 1].timestamp).getTime() - new Date(events[0].timestamp).getTime();
  const totalMinutes = Math.max(1, totalMs / 60000);
  const velocityPerMinute = Math.round((transitions.length / totalMinutes) * 100) / 100;

  // Most frequent transition pair
  const pairCounts: Record<string, number> = {};
  transitions.forEach(t => {
    const key = `${t.from}→${t.to}`;
    pairCounts[key] = (pairCounts[key] ?? 0) + 1;
  });
  const topTransition = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Time spent per emotion state (ms)
  const stateProfile: Record<string, number> = {};
  for (let i = 1; i < events.length; i++) {
    const em = events[i - 1].detectedEmotion;
    const dur = new Date(events[i].timestamp).getTime() - new Date(events[i - 1].timestamp).getTime();
    stateProfile[em] = (stateProfile[em] ?? 0) + dur;
  }
  // Convert to percentage of total time
  const statePercent: Record<string, number> = {};
  Object.entries(stateProfile).forEach(([em, ms]) => {
    statePercent[em] = Math.round((ms / totalMs) * 100);
  });

  return NextResponse.json({
    transitions: transitions.slice(0, 50), // most recent 50
    velocityPerMinute,
    topTransition,
    stateProfile: statePercent,
    totalTransitions: transitions.length,
    sessionDurationMinutes: Math.round(totalMinutes),
    riskFlag: velocityPerMinute > 3, // > 3 transitions/min = rapid cycling flag
  });
}
