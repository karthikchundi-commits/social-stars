import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { geminiJSON, isGeminiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Therapist account required' }, { status: 403 });
  }

  const { childId } = await request.json();
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      completedActivities: {
        include: { activity: true },
        orderBy: { completedAt: 'desc' },
      },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 30 },
      achievements: { orderBy: { earnedAt: 'desc' } },
      assignments: { include: { activity: true } },
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const link = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });

  // Compute statistics
  const byType: Record<string, number> = {};
  const byScore: number[] = [];
  child.completedActivities.forEach((ca) => {
    byType[ca.activity.type] = (byType[ca.activity.type] ?? 0) + 1;
    if (ca.score !== null && ca.score !== undefined) byScore.push(ca.score);
  });

  const moodCounts: Record<string, number> = {};
  child.moodCheckIns.forEach((m) => {
    moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;
  });

  const avgScore = byScore.length > 0 ? (byScore.reduce((a, b) => a + b, 0) / byScore.length).toFixed(1) : 'N/A';

  // Weekly completion pattern (last 4 weeks)
  const now = new Date();
  const weeklyCompletions = [0, 0, 0, 0];
  child.completedActivities.forEach((ca) => {
    const daysAgo = Math.floor((now.getTime() - new Date(ca.completedAt).getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysAgo / 7);
    if (weekIndex < 4) weeklyCompletions[weekIndex]++;
  });

  const pendingAssignments = child.assignments.filter(
    (a) => !child.completedActivities.some((ca) => ca.activityId === a.activityId)
  );

  const prompt = `You are an expert paediatric occupational therapist analyzing progress data for a child with autism. Generate detailed clinical insights.

## Child Profile
- Name: ${child.name}
- Age: ${child.age} years old

## Activity Data
- Total activities completed: ${child.completedActivities.length}
- Completions by type: ${JSON.stringify(byType)}
- Average score: ${avgScore}%
- Weekly completions (most recent first): Week 1: ${weeklyCompletions[0]}, Week 2: ${weeklyCompletions[1]}, Week 3: ${weeklyCompletions[2]}, Week 4: ${weeklyCompletions[3]}
- Achievements earned: ${child.achievements.length} (${child.achievements.map((a) => a.title).join(', ') || 'none'})
- Pending assigned activities: ${pendingAssignments.length}

## Mood Data (last 30 days)
- Mood frequency: ${JSON.stringify(moodCounts)}
- Most common moods: ${Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, c]) => `${m}(${c})`).join(', ') || 'no data'}
- Recent mood trend (last 7): ${child.moodCheckIns.slice(0, 7).map((m) => m.mood).join(', ') || 'no data'}

## Output Format
Return ONLY a valid JSON object:
{
  "summary": "2-3 sentence clinical summary of overall progress",
  "strengths": [
    { "title": "Strength title", "detail": "1-2 sentences of evidence-based detail" }
  ],
  "areasForGrowth": [
    { "title": "Area title", "detail": "1-2 sentences with specific recommendation" }
  ],
  "moodInsight": "1-2 sentences about mood patterns and what they suggest",
  "engagementTrend": "improving | stable | declining | insufficient_data",
  "engagementDetail": "1-2 sentences explaining the trend",
  "nextSteps": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "parentTips": [
    "Practical tip for parent based on this child's data 1",
    "Practical tip for parent based on this child's data 2"
  ],
  "riskFlags": []
}

riskFlags should be an array of strings identifying any concerns (e.g. "No activity in 2 weeks", "Persistent anxious/angry moods"). Empty array if none.

Guidelines:
- Be specific to this child's actual data, not generic
- Use warm, professional language
- Focus on strengths first
- Recommendations must be actionable within the app

Respond with ONLY the JSON object.`;

  try {
    const insights = await geminiJSON(prompt, 2048);
    return NextResponse.json({ insights, stats: { byType, moodCounts, weeklyCompletions, avgScore } });
  } catch (err: any) {
    console.error('Insights generation error:', err);
    return NextResponse.json({ error: err.message ?? 'Insights generation failed' }, { status: 500 });
  }
}
