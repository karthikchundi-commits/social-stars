import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, activityId, activityType, eventType, hesitationMs, attemptNumber, questionCtx } = body;

    if (!childId || !activityId || !activityType || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.confusionEvent.create({
      data: {
        childId,
        activityId,
        activityType,
        eventType,
        hesitationMs,
        attemptNumber: attemptNumber ?? 1,
        questionCtx,
      },
    });

    // Update LearningAdaptation confusion areas
    const existing = await prisma.learningAdaptation.findUnique({ where: { childId } });
    const confusionAreas: Record<string, number> = existing ? JSON.parse(existing.confusionAreas) : {};

    // Increment confusion score for this activity type (decay over time via averaging)
    const current = confusionAreas[activityType] ?? 0;
    confusionAreas[activityType] = Math.min(1, current + 0.1);

    // Adjust difficulty based on event type
    let difficultyDelta = 0;
    if (eventType === 'wrong_answer') difficultyDelta = -0.05;
    if (eventType === 'hesitation') difficultyDelta = -0.03;
    if (eventType === 'retry') difficultyDelta = -0.02;

    const currentDifficulty = existing?.difficultyLevel ?? 0.5;
    const newDifficulty = Math.max(0.1, Math.min(1.0, currentDifficulty + difficultyDelta));

    await prisma.learningAdaptation.upsert({
      where: { childId },
      create: {
        childId,
        confusionAreas: JSON.stringify(confusionAreas),
        difficultyLevel: newDifficulty,
      },
      update: {
        confusionAreas: JSON.stringify(confusionAreas),
        difficultyLevel: newDifficulty,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Confusion event error:', error);
    return NextResponse.json({ error: 'Failed to save confusion event' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const events = await prisma.confusionEvent.findMany({
    where: { childId },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Build confusion map: per activity type, count wrong answers vs total attempts
  const confusionMap: Record<string, { total: number; wrong: number; hesitations: number; avgHesitationMs: number }> = {};
  for (const event of events) {
    if (!confusionMap[event.activityType]) {
      confusionMap[event.activityType] = { total: 0, wrong: 0, hesitations: 0, avgHesitationMs: 0 };
    }
    confusionMap[event.activityType].total++;
    if (event.eventType === 'wrong_answer') confusionMap[event.activityType].wrong++;
    if (event.eventType === 'hesitation') {
      confusionMap[event.activityType].hesitations++;
      confusionMap[event.activityType].avgHesitationMs =
        (confusionMap[event.activityType].avgHesitationMs + (event.hesitationMs ?? 0)) / 2;
    }
  }

  const adaptation = await prisma.learningAdaptation.findUnique({ where: { childId } });

  return NextResponse.json({ confusionMap, adaptation, events });
}
