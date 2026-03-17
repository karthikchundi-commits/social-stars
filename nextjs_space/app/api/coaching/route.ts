import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ hint: "You can do it! Try again! 🌟", encouragement: "Keep going!" });
  }

  try {
    const body = await request.json();
    const { childId, activityType, activityTitle, question, wrongAnswers, hesitationMs, childAge } = body;

    if (!childId || !activityType) {
      return NextResponse.json({ error: 'childId and activityType required' }, { status: 400 });
    }

    // Get child's profile for personalisation
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { name: true, age: true, characteristics: true },
    });

    const profile = child?.characteristics ? JSON.parse(child.characteristics) : null;
    const age = childAge ?? child?.age ?? 4;
    const name = child?.name ?? 'friend';

    const contextInfo = profile ? `Child interests: ${profile.interests || 'not specified'}. Communication level: ${profile.communicationLevel || 'verbal'}.` : '';

    const prompt = `You are a warm, encouraging AI coach for ${name}, age ${age}, who has autism. You speak in VERY simple language (max 10 words per sentence). Be like a kind, playful teacher.

Activity: ${activityType} - "${activityTitle ?? activityType}"
${question ? `Question: ${question}` : ''}
${wrongAnswers ? `Wrong answers so far: ${wrongAnswers}` : ''}
${hesitationMs ? `Child has been thinking for ${Math.round(hesitationMs / 1000)} seconds` : ''}
${contextInfo}

Generate a coaching hint as JSON:
{
  "hint": "Simple helpful hint in 1-2 short sentences. Use emoji. Max 20 words total.",
  "encouragement": "Short encouraging phrase. Max 8 words. Use emoji.",
  "strategy": "one word strategy: look|listen|think|point|remember"
}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ hint: "Look carefully! You can do it! 🌟", encouragement: "Try again! 💪", strategy: "look" });
    }

    const result = JSON.parse(match[0]);

    // Increment totalHints counter
    await prisma.learningAdaptation.upsert({
      where: { childId },
      create: { childId, totalHints: 1 },
      update: { totalHints: { increment: 1 } },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Coaching error:', error);
    return NextResponse.json({ hint: "Look at the pictures! 🌟", encouragement: "You can do it! 💪", strategy: "look" });
  }
}
