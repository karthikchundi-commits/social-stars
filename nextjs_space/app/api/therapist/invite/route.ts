import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: return therapist's invite code
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Not a therapist account' }, { status: 403 });
  }

  // Generate invite code if missing
  let inviteCode = user.inviteCode;
  if (!inviteCode) {
    inviteCode = `THER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await prisma.user.update({ where: { id: userId }, data: { inviteCode } });
  }

  return NextResponse.json({ inviteCode });
}

// POST: parent links themselves to a therapist using invite code
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteCode } = await request.json();
  if (!inviteCode) return NextResponse.json({ error: 'Invite code required' }, { status: 400 });

  const therapist = await prisma.user.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
  if (!therapist || therapist.role !== 'therapist') {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  }

  if (therapist.id === userId) {
    return NextResponse.json({ error: 'Cannot link to yourself' }, { status: 400 });
  }

  const existing = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: therapist.id, parentId: userId } },
  });
  if (existing) return NextResponse.json({ message: 'Already linked' }, { status: 200 });

  await prisma.therapistFamily.create({
    data: { therapistId: therapist.id, parentId: userId },
  });

  return NextResponse.json({ success: true, therapistName: therapist.name });
}
