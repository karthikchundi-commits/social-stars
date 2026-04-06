import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim().toLowerCase();
  const state = searchParams.get('state')?.trim().toLowerCase();
  const country = searchParams.get('country')?.trim().toLowerCase();
  const name = searchParams.get('name')?.trim().toLowerCase();

  const [therapists, existingLinks] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'therapist',
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(state && { state: { contains: state, mode: 'insensitive' } }),
        ...(country && { country: { contains: country, mode: 'insensitive' } }),
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      select: { id: true, name: true, inviteCode: true, city: true, state: true, country: true, bio: true },
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
      city: t.city,
      state: t.state,
      country: t.country,
      bio: t.bio,
    })),
  });
}
