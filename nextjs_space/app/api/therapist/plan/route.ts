import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { geminiJSON, isGeminiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// GET — fetch plans for a child
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  // Allow both therapists and parents to read
  const plans = await prisma.therapyPlan.findMany({
    where: { childId, status: 'active' },
    include: { therapist: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ plans });
}

// POST — AI-generate a new therapy plan
export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Therapist account required' }, { status: 403 });
  }

  const { childId, durationWeeks = 4, goals, challenges, focusAreas } = await request.json();
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      completedActivities: { include: { activity: true }, orderBy: { completedAt: 'desc' }, take: 20 },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 14 },
      achievements: { orderBy: { earnedAt: 'desc' }, take: 5 },
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const link = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });

  // Build context
  const completedTypes = [...new Set(child.completedActivities.map((ca) => ca.activity.type))];
  const recentMoods = child.moodCheckIns.map((m) => m.mood);
  const totalCompleted = child.completedActivities.length;

  const prompt = `You are an expert paediatric occupational therapist. Create a personalised ${durationWeeks}-week therapy plan for a child with autism.

## Child Profile
- Name: ${child.name}
- Age: ${child.age} years old
- Total activities completed: ${totalCompleted}
- Activity types completed so far: ${completedTypes.join(', ') || 'none yet'}
- Recent moods (last 14 days): ${recentMoods.join(', ') || 'no data'}
- Achievements earned: ${child.achievements.length}
${goals ? `- Therapist goals: ${goals}` : ''}
${challenges ? `- Current challenges: ${challenges}` : ''}
${focusAreas ? `- Focus areas: ${focusAreas}` : ''}

## Available Activity Types
- breathing: Guided breathing exercises for regulation
- emotion: Emotion recognition games (pick correct face)
- scenario: Social scenario multiple-choice decisions
- story: Interactive stories with embedded questions
- communication: Tap-to-speak communication board
- social_coach: Real-life social situation simulation with branching dialogue

## Output Format
Return ONLY a valid JSON object with these fields:
{
  "title": "Plan title (max 8 words)",
  "weeklyGoal": "One overarching goal for this plan",
  "durationWeeks": ${durationWeeks},
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Focus theme for this week",
      "activityTypes": ["breathing", "emotion"],
      "activitiesPerWeek": 3,
      "goals": ["Specific measurable goal 1", "Specific measurable goal 2"],
      "tips": ["Practical tip for parent 1", "Practical tip for parent 2"],
      "parentNote": "Short note to parent about this week's focus"
    }
  ],
  "overallTips": ["General tip 1", "General tip 2", "General tip 3"]
}

## Guidelines
- Build progressively — start simpler, increase complexity each week
- Balance regulation (breathing) with social skills (scenario, social_coach, story)
- Consider the child's recent mood patterns when sequencing activities
- Tips must be practical, actionable, and parent-friendly
- Keep language warm and encouraging
- For children with anxious/angry moods, front-load breathing activities

Respond with ONLY the JSON object. No markdown, no explanation.`;

  try {
    const parsed = await geminiJSON<{ title: string; weeklyGoal: string; durationWeeks: number; weeks: any[]; overallTips: string[] }>(prompt, 4096);

    // Archive previous active plans for this child by this therapist
    await prisma.therapyPlan.updateMany({
      where: { childId, therapistId: userId, status: 'active' },
      data: { status: 'archived' },
    });

    const plan = await prisma.therapyPlan.create({
      data: {
        childId,
        therapistId: userId,
        title: parsed.title,
        content: JSON.stringify(parsed),
        status: 'active',
      },
    });

    return NextResponse.json({ plan, data: parsed }, { status: 201 });
  } catch (err: any) {
    console.error('Plan generation error:', err);
    return NextResponse.json({ error: err.message ?? 'Plan generation failed' }, { status: 500 });
  }
}
