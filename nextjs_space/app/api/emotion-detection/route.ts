import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, activityId, sessionId, source, transcript, detectedEmotion: clientEmotion, confidence: clientConfidence } = body;

    if (!childId || !sessionId || !source) {
      return NextResponse.json({ error: 'childId, sessionId, source required' }, { status: 400 });
    }

    let detectedEmotion = 'neutral';
    let confidence = 0.7;

    if (source === 'face' && clientEmotion) {
      // Emotion already detected client-side via face-api.js — just save it
      detectedEmotion = clientEmotion;
      confidence = clientConfidence ?? 0.8;
    } else if (source === 'voice' && transcript) {
      // Detect emotion from voice transcript keywords
      const lower = transcript.toLowerCase();
      if (lower.includes('happy') || lower.includes('yay') || lower.includes('fun')) {
        detectedEmotion = 'happy'; confidence = 0.8;
      } else if (lower.includes('sad') || lower.includes('crying') || lower.includes('cry')) {
        detectedEmotion = 'sad'; confidence = 0.8;
      } else if (lower.includes("don't know") || lower.includes('confused') || lower.includes('what')) {
        detectedEmotion = 'confused'; confidence = 0.75;
      } else if (lower.includes('hard') || lower.includes('difficult') || lower.includes('too hard')) {
        detectedEmotion = 'frustrated'; confidence = 0.75;
      } else {
        detectedEmotion = 'neutral'; confidence = 0.6;
      }
    }

    await prisma.emotionDetectionEvent.create({
      data: { childId, activityId, sessionId, detectedEmotion, confidence, source },
    });

    return NextResponse.json({ detectedEmotion, confidence });
  } catch (error: any) {
    console.error('Emotion detection error:', error);
    return NextResponse.json({ error: error?.message ?? 'Detection failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  const sessionId = searchParams.get('sessionId');

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const where: any = { childId };
  if (sessionId) where.sessionId = sessionId;

  const events = await prisma.emotionDetectionEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  return NextResponse.json({ events });
}
