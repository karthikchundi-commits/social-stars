import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function calculateStreak(completedActivities: { completedAt: Date }[]): number {
  if (!completedActivities.length) return 0;

  const uniqueDays = Array.from(
    new Set(completedActivities.map((ca) => {
      const d = new Date(ca.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))
  ).sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const dayMs = 86400000;

  // Streak must include today or yesterday to be active
  if (uniqueDays[0] < todayMs - dayMs) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i - 1] - uniqueDays[i] === dayMs) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'childId is required' },
        { status: 400 }
      );
    }

    const completedActivities = await prisma.completedActivity.findMany({
      where: {
        childId,
      },
      include: {
        activity: true,
      },
    });

    const achievements = await prisma.achievement.findMany({
      where: {
        childId,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    const streak = calculateStreak(completedActivities);

    const assignments = await prisma.activityAssignment.findMany({
      where: { childId },
      include: { activity: true },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({ completedActivities, achievements, streak, assignments });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, activityId, score, timeSpentSecs } = body;

    if (!childId || !activityId) {
      return NextResponse.json(
        { error: 'childId and activityId are required' },
        { status: 400 }
      );
    }

    // Check if already completed
    const existing = await prisma.completedActivity.findUnique({
      where: {
        childId_activityId: {
          childId,
          activityId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Activity already completed' },
        { status: 200 }
      );
    }

    // Mark as completed
    const completed = await prisma.completedActivity.create({
      data: {
        childId,
        activityId,
        score,
        timeSpentSecs,
      },
    });

    // Check if child should earn an achievement
    const totalCompleted = await prisma.completedActivity.count({
      where: { childId },
    });

    // Fetch the completed activity type
    const activityRecord = await prisma.activity.findUnique({ where: { id: activityId } });
    const activityType = activityRecord?.type ?? '';

    // Count by type for type-specific achievements
    const breathingCount = activityType === 'breathing'
      ? await prisma.completedActivity.count({ where: { childId, activity: { type: 'breathing' } } })
      : 0;
    const communicationCount = activityType === 'communication'
      ? await prisma.completedActivity.count({ where: { childId, activity: { type: 'communication' } } })
      : 0;

    // Existing achievement titles to avoid duplicates
    const existingTitles = new Set(
      (await prisma.achievement.findMany({ where: { childId }, select: { title: true } }))
        .map((a) => a.title)
    );

    const achievementCandidates: { title: string; description: string; badgeType: string; badgeImage: string }[] = [];

    if (totalCompleted === 1) achievementCandidates.push({ title: 'First Star!', description: 'Completed your first activity', badgeType: 'star', badgeImage: 'https://cdn.abacus.ai/images/b5406975-2ff8-4029-b6c6-04471b1fddb5.jpg' });
    if (totalCompleted === 5) achievementCandidates.push({ title: 'Rising Star!', description: 'Completed 5 activities', badgeType: 'star', badgeImage: 'https://cdn.abacus.ai/images/b5406975-2ff8-4029-b6c6-04471b1fddb5.jpg' });
    if (totalCompleted === 10) achievementCandidates.push({ title: 'Super Star!', description: 'Completed 10 activities', badgeType: 'trophy', badgeImage: 'https://cdn.abacus.ai/images/11bd862a-e6ac-401b-a5ea-b82f771a991e.jpg' });
    if (totalCompleted === 20) achievementCandidates.push({ title: 'Star Explorer!', description: 'Completed 20 activities!', badgeType: 'trophy', badgeImage: 'https://cdn.abacus.ai/images/11bd862a-e6ac-401b-a5ea-b82f771a991e.jpg' });
    if (breathingCount === 1) achievementCandidates.push({ title: 'Calm Breather!', description: 'Completed your first breathing exercise', badgeType: 'star', badgeImage: 'https://cdn.abacus.ai/images/b5406975-2ff8-4029-b6c6-04471b1fddb5.jpg' });
    if (breathingCount === 3) achievementCandidates.push({ title: 'Calm Champion!', description: 'Completed 3 breathing exercises', badgeType: 'trophy', badgeImage: 'https://cdn.abacus.ai/images/11bd862a-e6ac-401b-a5ea-b82f771a991e.jpg' });
    if (communicationCount === 1) achievementCandidates.push({ title: 'Great Talker!', description: 'Used the communication board for the first time', badgeType: 'star', badgeImage: 'https://cdn.abacus.ai/images/b5406975-2ff8-4029-b6c6-04471b1fddb5.jpg' });

    let newAchievement = null;
    for (const candidate of achievementCandidates) {
      if (!existingTitles.has(candidate.title)) {
        newAchievement = await prisma.achievement.create({ data: { childId, ...candidate } });
        break; // Award one achievement at a time
      }
    }

    return NextResponse.json(
      {
        completed,
        achievement: newAchievement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error marking activity complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark activity complete' },
      { status: 500 }
    );
  }
}
