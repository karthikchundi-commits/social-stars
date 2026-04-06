import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE: unlink from a therapist (and remove subscription managed by them)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { therapistId } = await request.json();
  if (!therapistId) return NextResponse.json({ error: 'therapistId required' }, { status: 400 });

  // Remove the link
  await prisma.therapistFamily.deleteMany({ where: { therapistId, parentId: userId } });

  // Remove subscription managed by this therapist
  await prisma.familySubscription.deleteMany({ where: { parentId: userId, therapistId } });

  return NextResponse.json({ success: true });
}
