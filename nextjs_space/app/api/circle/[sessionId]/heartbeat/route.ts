import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { participantId } = await req.json();
    await prisma.liveParticipant.update({
      where: { id: participantId },
      data: { lastSeen: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
