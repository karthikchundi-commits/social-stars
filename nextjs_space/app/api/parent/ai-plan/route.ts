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
      completedActivities: { include: { activity: true }, orderBy: { completedAt: 'desc' }, take: 20 },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 7 },
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const profile = child.characteristics ? JSON.parse(child.characteristics) : null;
  const completedTypes = new Set(child.completedActivities.map((ca) => ca.activity.type));
  const recentMoods = child.moodCheckIns.map((m) => m.mood);
  const totalDone = child.completedActivities.length;

  const profileSection = profile ? `
Child profile from parent:
- Communication level: ${profile.communicationLevel ?? 'not specified'}
- Sensory needs: ${profile.sensoryNeeds || 'not specified'}
- Interests & favourite things: ${profile.interests || 'not specified'}
- Current challenges: ${profile.challenges || 'not specified'}
- Goals the parent wants to work on: ${profile.goals || 'not specified'}
- Additional notes: ${profile.notes || 'none'}
` : 'No child profile filled in yet — use age and mood as the main guide.';

  const prompt = `You are a friendly assistant helping a parent plan activities for their autistic child at home. Create a simple, fun, doable one-week activity plan tailored to this specific child. Use everyday language — no clinical terms. Use the child's profile, interests, and challenges to make the plan feel personal.

Child: ${child.name}, Age ${child.age}
${profileSection}
Total activities completed so far: ${totalDone}
Activity types tried: ${Array.from(completedTypes).join(', ') || 'none yet'}
Recent moods: ${recentMoods.join(', ') || 'not recorded yet'}

Available activity types in the app:
- breathing: calming breathing exercises (good for anxious or angry moods)
- emotion: identify emotions from pictures (builds emotional vocabulary)
- scenario: choose the right response in social situations (builds social skills)
- story: interactive stories with questions (builds comprehension + empathy)
- communication: tap pictures to practice expressing needs and feelings
- social_coach: branching conversations to practice real-life social situations

Create a 5-day plan (Mon–Fri) with 1–2 activities per day, picking the most appropriate types for this child. Respond with JSON:
{
  "title": "Catchy, fun plan title for this child",
  "weekFocus": "One sentence describing the theme of this week",
  "days": [
    {
      "day": "Monday",
      "activities": [
        { "type": "activity_type", "title": "What to do", "tip": "Quick tip for the parent on how to make it fun" }
      ]
    }
  ],
  "generalTips": ["tip 1 for making the week successful", "tip 2", "tip 3"],
  "encouragement": "Warm message to the parent"
}`;

  const plan = await geminiJSON(prompt, 2000);
  return NextResponse.json({ plan });
}
