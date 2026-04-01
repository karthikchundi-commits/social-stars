// PC-14: Automated Clinical Progress Report Generation
// Aggregates all child data and generates a structured SOAP-format clinical progress note.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { geminiJSON, isGeminiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { childId } = await request.json();
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  // Verify therapist has access to this child
  const link = await prisma.therapistFamily.findFirst({
    where: {
      therapistId: userId,
      parent: { children: { some: { id: childId } } },
    },
  });
  if (!link) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      completedActivities: {
        include: { activity: true },
        orderBy: { completedAt: 'desc' },
        take: 100,
      },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 30 },
      achievements: { orderBy: { earnedAt: 'desc' } },
      therapistNotes: {
        where: { therapistId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      therapyPlans: {
        where: { therapistId: userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      learningAdaptation: true,
      confusionEvents: { orderBy: { timestamp: 'desc' }, take: 100 },
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const profile = child.characteristics ? JSON.parse(child.characteristics) : null;

  // Activity breakdown and trend (last 2 weeks vs prior 2 weeks)
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;

  const recent = child.completedActivities.filter(ca => new Date(ca.completedAt).getTime() >= twoWeeksAgo);
  const prior = child.completedActivities.filter(ca => {
    const t = new Date(ca.completedAt).getTime();
    return t >= fourWeeksAgo && t < twoWeeksAgo;
  });

  const recentByType: Record<string, number> = {};
  recent.forEach(ca => { recentByType[ca.activity.type] = (recentByType[ca.activity.type] ?? 0) + 1; });

  const priorByType: Record<string, number> = {};
  prior.forEach(ca => { priorByType[ca.activity.type] = (priorByType[ca.activity.type] ?? 0) + 1; });

  // Confusion summary
  const confusionByType: Record<string, { wrong: number; total: number }> = {};
  for (const ev of child.confusionEvents) {
    if (!confusionByType[ev.activityType]) confusionByType[ev.activityType] = { wrong: 0, total: 0 };
    confusionByType[ev.activityType].total++;
    if (ev.eventType === 'wrong_answer') confusionByType[ev.activityType].wrong++;
  }

  // Mood counts
  const moodCounts: Record<string, number> = {};
  child.moodCheckIns.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1; });

  const therapistName = session?.user?.name ?? 'Therapist';
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const activeGoals = child.therapyPlans[0] ? JSON.parse(child.therapyPlans[0].content) : null;

  const prompt = `You are a licensed speech-language pathologist / ASD specialist writing a structured clinical progress note.
Write a professional, evidence-based SOAP note for this child's therapy progress.
Use clinical terminology but remain readable for IEP/insurance documentation.
Today's date: ${reportDate}
Therapist: ${therapistName}

Child: ${child.name}, Age ${child.age}
${profile ? `Profile: communication=${profile.communicationLevel}, sensory needs=${profile.sensoryNeeds || 'n/a'}, challenges=${profile.challenges || 'n/a'}, goals=${profile.goals || 'n/a'}` : ''}

Active therapy plan goal: ${activeGoals?.weeklyGoal ?? 'Not specified'}

Activities last 14 days (by type): ${JSON.stringify(recentByType)} (total: ${recent.length})
Activities prior 14 days (by type): ${JSON.stringify(priorByType)} (total: ${prior.length})
Overall completed: ${child.completedActivities.length}
Badges: ${child.achievements.length}

Error rates by activity type: ${JSON.stringify(Object.fromEntries(Object.entries(confusionByType).map(([k, v]) => [k, v.total > 0 ? `${((v.wrong / v.total) * 100).toFixed(0)}% errors` : '0%'])))}
Difficulty level: ${child.learningAdaptation ? (child.learningAdaptation.difficultyLevel * 100).toFixed(0) + '%' : 'N/A'}
Mood distribution (last 30 days): ${JSON.stringify(moodCounts)}

Recent therapist observations: ${child.therapistNotes.map(n => `[${n.noteType}] ${n.content}`).join(' | ') || 'None recorded'}

Generate a clinical progress note as JSON with exactly this structure:
{
  "subjective": "1-2 sentences: parent/caregiver report and child's presentation",
  "objective": "2-3 sentences: measurable data — activities completed, error rates, difficulty progression, mood patterns",
  "assessment": "2-3 sentences: clinical interpretation of progress toward goals, areas of strength, areas of concern",
  "plan": ["goal-directed recommendation 1", "recommendation 2", "recommendation 3"],
  "overallProgress": "improving" | "stable" | "declining",
  "progressNote": "One plain-English sentence suitable for sharing with parents"
}`;

  const report = await geminiJSON(prompt, 800);

  return NextResponse.json({
    report,
    meta: {
      childName: child.name,
      childAge: child.age,
      reportDate,
      therapistName,
      totalCompleted: child.completedActivities.length,
      recentCompleted: recent.length,
    },
  });
}
