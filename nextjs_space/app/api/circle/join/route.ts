import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { pusher } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { joinCode, displayName, childId, avatarColor } = await req.json();
    if (!joinCode || !displayName) {
      return NextResponse.json({ error: 'joinCode and displayName required' }, { status: 400 });
    }

    const liveSession = await prisma.liveSession.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: { participants: true },
    });

    if (!liveSession || liveSession.status === 'ended') {
      return NextResponse.json({ error: 'Session not found or has ended' }, { status: 404 });
    }

    // Lazy cleanup: remove stale participants (last seen > 45s ago)
    const staleTime = new Date(Date.now() - 45000);
    const stale = liveSession.participants.filter(
      p => !p.isHost && p.lastSeen < staleTime
    );
    if (stale.length > 0) {
      await prisma.liveParticipant.deleteMany({ where: { id: { in: stale.map(p => p.id) } } });
      for (const p of stale) {
        await pusher.trigger(`circle-${joinCode.toUpperCase()}`, 'participant:left', { participantId: p.id });
      }
    }

    const participant = await prisma.liveParticipant.create({
      data: {
        sessionId: liveSession.id,
        displayName,
        childId: childId || null,
        avatarColor: avatarColor || '#34D399',
        isHost: false,
      },
    });

    await pusher.trigger(`circle-${joinCode.toUpperCase()}`, 'participant:joined', {
      id: participant.id,
      displayName: participant.displayName,
      avatarColor: participant.avatarColor,
      isHost: false,
      currentEmotion: 'neutral',
      childId: childId || null,
    });

    // Return fresh participant list
    const freshParticipants = await prisma.liveParticipant.findMany({
      where: { sessionId: liveSession.id },
    });

    return NextResponse.json({
      sessionId: liveSession.id,
      joinCode: liveSession.joinCode,
      activityId: liveSession.activityId,
      status: liveSession.status,
      currentPage: liveSession.currentPage,
      participantId: participant.id,
      participants: freshParticipants.map(p => ({
        id: p.id,
        displayName: p.displayName,
        avatarColor: p.avatarColor,
        isHost: p.isHost,
        currentEmotion: p.currentEmotion,
        childId: p.childId,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
