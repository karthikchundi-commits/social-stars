import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pusher } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = require('crypto').randomBytes(6);
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { activityId, hostName } = await req.json();
    if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 });

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity || activity.type !== 'story') {
      return NextResponse.json({ error: 'Activity not found or not a story' }, { status: 404 });
    }

    let joinCode = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const exists = await prisma.liveSession.findUnique({ where: { joinCode: candidate } });
      if (!exists) { joinCode = candidate; break; }
    }
    if (!joinCode) return NextResponse.json({ error: 'Could not generate join code' }, { status: 500 });

    const liveSession = await prisma.liveSession.create({
      data: {
        joinCode,
        activityId,
        status: 'waiting',
        currentPage: 0,
      },
    });

    const host = await prisma.liveParticipant.create({
      data: {
        sessionId: liveSession.id,
        displayName: hostName || 'Host',
        avatarColor: '#818CF8',
        isHost: true,
      },
    });

    await pusher.trigger(`circle-${joinCode}`, 'participant:joined', {
      id: host.id,
      displayName: host.displayName,
      avatarColor: host.avatarColor,
      isHost: true,
      currentEmotion: 'neutral',
      childId: null,
    });

    return NextResponse.json({
      sessionId: liveSession.id,
      joinCode,
      participantId: host.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
