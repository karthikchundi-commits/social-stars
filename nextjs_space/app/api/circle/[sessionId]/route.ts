import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { pusher } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await prisma.liveSession.findUnique({
      where: { id: params.sessionId },
      include: { participants: true, activity: true },
    });
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: session.id,
      joinCode: session.joinCode,
      activityId: session.activityId,
      activityTitle: session.activity.title,
      activityContent: session.activity.content,
      status: session.status,
      currentPage: session.currentPage,
      participants: session.participants.map(p => ({
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

export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const body = await req.json();
    const { action, participantId } = body;

    const session = await prisma.liveSession.findUnique({ where: { id: params.sessionId } });
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const channel = `circle-${session.joinCode}`;

    if (action === 'start') {
      const participant = await prisma.liveParticipant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return NextResponse.json({ error: 'Only host can start' }, { status: 403 });

      await prisma.liveSession.update({ where: { id: params.sessionId }, data: { status: 'active' } });
      const activity = await prisma.activity.findUnique({ where: { id: session.activityId } });
      const pages = JSON.parse(activity?.content || '{}').pages ?? [];
      await pusher.trigger(channel, 'host:session-started', {
        activityId: session.activityId,
        activityTitle: activity?.title,
        totalPages: pages.length,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'advance') {
      const participant = await prisma.liveParticipant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return NextResponse.json({ error: 'Only host can advance' }, { status: 403 });

      const activity = await prisma.activity.findUnique({ where: { id: session.activityId } });
      const pages = JSON.parse(activity?.content || '{}').pages ?? [];
      const nextPage = Math.min(session.currentPage + 1, pages.length - 1);
      await prisma.liveSession.update({ where: { id: params.sessionId }, data: { currentPage: nextPage } });
      await pusher.trigger(channel, 'host:page-changed', { page: nextPage });
      return NextResponse.json({ ok: true });
    }

    if (action === 'end') {
      const participant = await prisma.liveParticipant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return NextResponse.json({ error: 'Only host can end' }, { status: 403 });

      await prisma.liveSession.update({ where: { id: params.sessionId }, data: { status: 'ended' } });
      await pusher.trigger(channel, 'host:session-ended', {});
      return NextResponse.json({ ok: true });
    }

    if (action === 'emotion') {
      const { emotion } = body;
      await prisma.liveParticipant.update({
        where: { id: participantId },
        data: { currentEmotion: emotion, lastSeen: new Date() },
      });
      await pusher.trigger(channel, 'participant:emotion', { participantId, emotion });
      return NextResponse.json({ ok: true });
    }

    if (action === 'answer') {
      const { answerIndex, isCorrect, displayName, avatarColor } = body;
      await pusher.trigger(channel, 'participant:answered', {
        participantId, displayName, answerIndex, isCorrect, avatarColor,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
