import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/circle/active — returns the live therapist session visible to this parent
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ session: null });

    const userId = (session.user as any).id;

    // Find the therapist linked to this parent
    const link = await prisma.therapistFamily.findFirst({
      where: { parentId: userId },
      include: { therapist: { select: { id: true, name: true } } },
    });
    if (!link) return NextResponse.json({ session: null });

    // Find the most recent active/waiting session from that therapist
    const liveSession = await prisma.liveSession.findFirst({
      where: {
        therapistId: link.therapistId,
        status: { in: ['waiting', 'active'] },
      },
      include: { activity: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!liveSession) return NextResponse.json({ session: null });

    return NextResponse.json({
      session: {
        id: liveSession.id,
        joinCode: liveSession.joinCode,
        activityTitle: liveSession.activity.title,
        status: liveSession.status,
        therapistName: link.therapist.name,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ session: null });
  }
}
