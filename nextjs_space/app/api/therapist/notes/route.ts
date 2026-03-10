import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — fetch notes for a child (therapist sees all; parent sees shared only)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  const where: any = { childId };
  if (role !== 'therapist') {
    // Parents only see shared notes
    where.isShared = true;
  }

  const notes = await prisma.therapistNote.findMany({
    where,
    include: { therapist: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ notes });
}

// POST — create a new note (therapist only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Therapist account required' }, { status: 403 });
  }

  const { childId, content, noteType = 'observation', isShared = true } = await request.json();
  if (!childId || !content) return NextResponse.json({ error: 'childId and content required' }, { status: 400 });

  // Verify therapist is linked to child's parent
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const link = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });

  const note = await prisma.therapistNote.create({
    data: { childId, therapistId: userId, content, noteType, isShared },
    include: { therapist: { select: { name: true } } },
  });

  return NextResponse.json({ note }, { status: 201 });
}

// DELETE — delete a note (therapist only, own notes)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('noteId');
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 });

  await prisma.therapistNote.deleteMany({
    where: { id: noteId, therapistId: userId },
  });

  return NextResponse.json({ success: true });
}
