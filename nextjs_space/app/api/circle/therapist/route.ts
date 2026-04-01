import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/circle/therapist — returns the therapist linked to the logged-in parent
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ therapist: null });

    const link = await prisma.therapistFamily.findFirst({
      where: { parentId: userId },
      include: { therapist: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ therapist: link?.therapist ?? null });
  } catch {
    return NextResponse.json({ therapist: null });
  }
}
