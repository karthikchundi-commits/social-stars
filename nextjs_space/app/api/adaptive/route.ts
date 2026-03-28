import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const adaptation = await prisma.learningAdaptation.findUnique({ where: { childId } });
  const confusionEvents = await prisma.confusionEvent.findMany({
    where: { childId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  // Calculate confusion scores per type
  const scores: Record<string, { events: number; wrong: number }> = {};
  for (const e of confusionEvents) {
    if (!scores[e.activityType]) scores[e.activityType] = { events: 0, wrong: 0 };
    scores[e.activityType].events++;
    if (e.eventType === 'wrong_answer') scores[e.activityType].wrong++;
  }

  // Build recommendations
  const activityTypes = ['breathing', 'emotion', 'scenario', 'story', 'communication'];
  const recommendations = activityTypes.map(type => {
    const data = scores[type];
    const confusionRate = data ? data.wrong / Math.max(data.events, 1) : 0;
    return {
      type,
      confusionRate: Math.round(confusionRate * 100),
      priority: confusionRate > 0.5 ? 'reduce' : confusionRate < 0.2 ? 'increase' : 'maintain',
    };
  });

  // Compute personalizedPriority: mood → activity types ordered by completion frequency
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [completedActivities, moodCheckIns] = await Promise.all([
    prisma.completedActivity.findMany({
      where: { childId, completedAt: { gte: thirtyDaysAgo } },
      include: { activity: { select: { type: true } } },
    }),
    prisma.moodCheckIn.findMany({
      where: { childId, checkedAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  // Build a map of date string → moods
  const dateMoodMap: Record<string, string[]> = {};
  for (const m of moodCheckIns) {
    const d = m.checkedAt.toISOString().split('T')[0];
    if (!dateMoodMap[d]) dateMoodMap[d] = [];
    dateMoodMap[d].push(m.mood);
  }

  // For each completed activity, find moods on the same day
  const moodTypeCounts: Record<string, Record<string, number>> = {};
  for (const ca of completedActivities) {
    const d = ca.completedAt.toISOString().split('T')[0];
    const moods = dateMoodMap[d] ?? [];
    const type = (ca as any).activity?.type ?? '';
    for (const mood of moods) {
      if (!moodTypeCounts[mood]) moodTypeCounts[mood] = {};
      moodTypeCounts[mood][type] = (moodTypeCounts[mood][type] ?? 0) + 1;
    }
  }

  // Build moodTypeMap: mood → types ordered by count DESC
  const moodTypeMap: Record<string, string[]> = {};
  for (const [mood, typeCounts] of Object.entries(moodTypeCounts)) {
    moodTypeMap[mood] = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);
  }

  return NextResponse.json({
    adaptation: adaptation ?? { difficultyLevel: 0.5, totalHints: 0 },
    recommendations,
    confusionScores: scores,
    personalizedPriority: moodTypeMap,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, sessionData } = body;
    // sessionData: { activityType, correct, total, hesitationMs }

    if (!childId || !sessionData) {
      return NextResponse.json({ error: 'childId and sessionData required' }, { status: 400 });
    }

    const existing = await prisma.learningAdaptation.findUnique({ where: { childId } });
    const confusionAreas: Record<string, number> = existing ? JSON.parse(existing.confusionAreas) : {};
    const preferredTypes: string[] = existing ? JSON.parse(existing.preferredTypes) : [];

    const { activityType, correct, total, mood } = sessionData;
    const successRate = total > 0 ? correct / total : 0;

    // Update confusion area - decay if doing well
    if (successRate > 0.8) {
      confusionAreas[activityType] = Math.max(0, (confusionAreas[activityType] ?? 0) - 0.15);
      if (!preferredTypes.includes(activityType)) preferredTypes.push(activityType);
    } else if (successRate < 0.4) {
      confusionAreas[activityType] = Math.min(1, (confusionAreas[activityType] ?? 0) + 0.1);
      const idx = preferredTypes.indexOf(activityType);
      if (idx !== -1) preferredTypes.splice(idx, 1);
    }

    // Update moodTypePerf: store mood+type performance
    if (mood && activityType) {
      const mpRaw = confusionAreas.__mp as unknown;
      let mp: Record<string, Record<string, number>> = {};
      if (typeof mpRaw === 'string') {
        try { mp = JSON.parse(mpRaw); } catch { mp = {}; }
      }
      if (!mp[mood]) mp[mood] = {};
      mp[mood][activityType] = (mp[mood][activityType] ?? 0) + (successRate > 0.5 ? 1 : 0);
      (confusionAreas as any).__mp = JSON.stringify(mp);
    }

    // Adjust difficulty
    const currentDifficulty = existing?.difficultyLevel ?? 0.5;
    let newDifficulty = currentDifficulty;
    if (successRate > 0.8) newDifficulty = Math.min(1.0, currentDifficulty + 0.05);
    else if (successRate < 0.4) newDifficulty = Math.max(0.1, currentDifficulty - 0.1);

    const updated = await prisma.learningAdaptation.upsert({
      where: { childId },
      create: {
        childId,
        difficultyLevel: newDifficulty,
        confusionAreas: JSON.stringify(confusionAreas),
        preferredTypes: JSON.stringify(preferredTypes),
      },
      update: {
        difficultyLevel: newDifficulty,
        confusionAreas: JSON.stringify(confusionAreas),
        preferredTypes: JSON.stringify(preferredTypes),
      },
    });

    return NextResponse.json({ adaptation: updated });
  } catch (error) {
    console.error('Adaptive update error:', error);
    return NextResponse.json({ error: 'Failed to update adaptation' }, { status: 500 });
  }
}
