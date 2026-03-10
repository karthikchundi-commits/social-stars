import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Therapist account required' }, { status: 403 });
  }

  const { title, description, type, content, childId, assignToChild } = await request.json();

  if (!title || !description || !type || !content) {
    return NextResponse.json({ error: 'title, description, type, and content are required' }, { status: 400 });
  }

  // If assigning to a child, verify the therapist is linked to their parent
  if (childId) {
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const link = await prisma.therapistFamily.findUnique({
      where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
    });
    if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });
  }

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      type,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      difficulty: 2,
      starsReward: 3,
      createdBy: userId,
    },
  });

  if (childId && assignToChild) {
    await prisma.activityAssignment.upsert({
      where: { childId_activityId: { childId, activityId: activity.id } },
      update: { assignedBy: userId },
      create: { childId, activityId: activity.id, assignedBy: userId },
    });
  }

  return NextResponse.json({ activity }, { status: 201 });
}
