import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: list all therapists in the app, with isLinked flag for the current parent
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [therapists, existingLinks] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'therapist' },
      select: { id: true, name: true, inviteCode: true },
      orderBy: { name: 'asc' },
    }),
    prisma.therapistFamily.findMany({
      where: { parentId: userId },
      select: { therapistId: true },
    }),
  ]);

  const linkedIds = new Set(existingLinks.map((l) => l.therapistId));

  return NextResponse.json({
    therapists: therapists.map((t) => ({
      id: t.id,
      name: t.name ?? 'Therapist',
      inviteCode: t.inviteCode,
      isLinked: linkedIds.has(t.id),
    })),
  });
}
