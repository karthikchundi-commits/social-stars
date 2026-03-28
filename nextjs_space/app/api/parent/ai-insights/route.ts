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

  const { childId } = await request.json();
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  // Verify parent owns this child
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, userId },
    include: {
      completedActivities: { include: { activity: true }, orderBy: { completedAt: 'desc' } },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 14 },
      achievements: true,
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const profile = child.characteristics ? JSON.parse(child.characteristics) : null;

  const byType: Record<string, number> = {};
  child.completedActivities.forEach((ca) => {
    byType[ca.activity.type] = (byType[ca.activity.type] ?? 0) + 1;
  });

  const moodCounts: Record<string, number> = {};
  child.moodCheckIns.forEach((m) => {
    moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;
  });

  const profileSection = profile ? `
Child profile from parent:
- Communication level: ${profile.communicationLevel ?? 'not specified'}
- Sensory needs: ${profile.sensoryNeeds || 'not specified'}
- Interests & favourite things: ${profile.interests || 'not specified'}
- Current challenges: ${profile.challenges || 'not specified'}
- Goals the parent wants to work on: ${profile.goals || 'not specified'}
- Additional notes: ${profile.notes || 'none'}
` : 'No child profile filled in yet.';

  const prompt = `You are a warm, encouraging assistant helping a parent understand their child's progress in a social skills app for autistic children ages 3–6. Use simple, jargon-free language. Be warm and supportive. Personalise your response to the specific child's profile where possible.

Child: ${child.name}, Age ${child.age}
${profileSection}
Total activities completed: ${child.completedActivities.length}
Activities by type: ${JSON.stringify(byType)}
Badges earned: ${child.achievements.length}
Mood check-ins (last 14 days): ${JSON.stringify(moodCounts)}

Generate a friendly, easy-to-read parent report as JSON with exactly this shape:
{
  "headline": "One encouraging sentence celebrating something specific about this child",
  "summary": "2–3 sentences explaining what the child has been doing and how they are developing",
  "moodInsight": "1–2 sentences about mood patterns in everyday language (e.g. 'Your child seems happiest on days they do breathing activities')",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "suggestionsThisWeek": [
    { "activityType": "breathing|emotion|scenario|story|communication|social_coach", "suggestion": "plain English description of what to try and why" }
  ],
  "tipsForYou": ["practical tip 1 for the parent", "practical tip 2", "practical tip 3"],
  "encouragement": "A warm, personal closing message for the parent"
}`;

  const insights = await geminiJSON(prompt, 1800);
  return NextResponse.json({ insights });
}
