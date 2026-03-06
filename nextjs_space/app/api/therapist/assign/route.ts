import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { childId, activityId, note } = await request.json();
  if (!childId || !activityId) {
    return NextResponse.json({ error: 'childId and activityId are required' }, { status: 400 });
  }

  // Verify therapist is linked to this child's parent
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const link = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });

  const assignment = await prisma.activityAssignment.upsert({
    where: { childId_activityId: { childId, activityId } },
    update: { note, assignedBy: userId },
    create: { childId, activityId, assignedBy: userId, note },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  const activityId = searchParams.get('activityId');
  if (!childId || !activityId) {
    return NextResponse.json({ error: 'childId and activityId are required' }, { status: 400 });
  }

  await prisma.activityAssignment.deleteMany({
    where: { childId, activityId, assignedBy: userId },
  });

  return NextResponse.json({ success: true });
}
