// PC-11: Natural Language Parent Query
// Parent asks a plain-English question about their child; Claude answers using the child's actual data.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { childId, question } = await request.json();
  if (!childId || !question?.trim()) {
    return NextResponse.json({ error: 'childId and question required' }, { status: 400 });
  }

  // Verify parent owns this child
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, userId },
    include: {
      completedActivities: { include: { activity: true }, orderBy: { completedAt: 'desc' }, take: 50 },
      moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 30 },
      achievements: true,
      learningAdaptation: true,
      confusionEvents: { orderBy: { timestamp: 'desc' }, take: 50 },
      emotionEvents: { orderBy: { timestamp: 'desc' }, take: 30 },
    },
  });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const profile = child.characteristics ? JSON.parse(child.characteristics) : null;

  // Build activity type breakdown
  const byType: Record<string, number> = {};
  child.completedActivities.forEach((ca) => {
    byType[ca.activity.type] = (byType[ca.activity.type] ?? 0) + 1;
  });

  // Mood trend last 30 days
  const moodCounts: Record<string, number> = {};
  child.moodCheckIns.forEach((m) => {
    moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;
  });

  // Confusion summary
  const confusionByType: Record<string, { wrong: number; hesitations: number; avgHesitationMs: number }> = {};
  for (const ev of child.confusionEvents) {
    if (!confusionByType[ev.activityType]) confusionByType[ev.activityType] = { wrong: 0, hesitations: 0, avgHesitationMs: 0 };
    if (ev.eventType === 'wrong_answer') confusionByType[ev.activityType].wrong++;
    if (ev.eventType === 'hesitation' && ev.hesitationMs) {
      confusionByType[ev.activityType].hesitations++;
      const c = confusionByType[ev.activityType];
      c.avgHesitationMs = (c.avgHesitationMs * (c.hesitations - 1) + ev.hesitationMs) / c.hesitations;
    }
  }

  // Emotion pattern
  const emotionCounts: Record<string, number> = {};
  child.emotionEvents.forEach((e) => {
    emotionCounts[e.detectedEmotion] = (emotionCounts[e.detectedEmotion] ?? 0) + 1;
  });

  const adaptation = child.learningAdaptation;

  const systemPrompt = `You are a warm, knowledgeable assistant helping a parent understand their autistic child's progress in a therapeutic app.
Answer in plain, jargon-free language. Be specific — always reference the child's actual data when it's relevant to the question.
Keep answers concise (2–4 sentences unless more detail is clearly needed). Use the child's name.`;

  const dataContext = `
Child: ${child.name}, Age ${child.age}
${profile ? `Profile: communication level=${profile.communicationLevel ?? 'not set'}, sensory needs=${profile.sensoryNeeds || 'not set'}, interests=${profile.interests || 'not set'}, challenges=${profile.challenges || 'not set'}` : 'No detailed profile set.'}

Activities completed (total ${child.completedActivities.length}): ${JSON.stringify(byType)}
Badges earned: ${child.achievements.length}
Current difficulty level: ${adaptation ? (adaptation.difficultyLevel * 100).toFixed(0) + '%' : 'not tracked yet'}
Confusion by activity type (wrong answers / hesitations): ${JSON.stringify(confusionByType)}
Mood check-ins (last 30 days): ${JSON.stringify(moodCounts)}
Detected emotions in sessions: ${JSON.stringify(emotionCounts)}
Most recent activity: ${child.completedActivities[0]?.activity?.title ?? 'none'} (${child.completedActivities[0]?.activity?.type ?? ''})

Parent's question: ${question}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: dataContext }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
  }

  return NextResponse.json({ answer: textBlock.text });
}
