import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Not a therapist account' }, { status: 403 });
  }

  const links = await prisma.therapistFamily.findMany({
    where: { therapistId: userId },
    include: {
      parent: {
        include: {
          children: {
            include: {
              completedActivities: { include: { activity: true } },
              achievements: true,
              moodCheckIns: { orderBy: { checkedAt: 'desc' }, take: 7 },
              assignments: { include: { activity: true } },
            },
          },
        },
      },
    },
  });

  const clients = links.map((link) => ({
    parentId: link.parent.id,
    parentName: link.parent.name,
    parentEmail: link.parent.email,
    linkedAt: link.linkedAt,
    children: link.parent.children.map((child) => ({
      id: child.id,
      name: child.name,
      age: child.age,
      avatarColor: child.avatarColor,
      totalCompleted: child.completedActivities.length,
      achievements: child.achievements.length,
      recentMoods: child.moodCheckIns.map((m) => m.mood),
      assignedActivities: child.assignments.map((a) => ({
        id: a.id,
        activityId: a.activityId,
        title: a.activity.title,
        type: a.activity.type,
        createdBy: a.activity.createdBy,
        note: a.note,
        assignedAt: a.assignedAt,
      })),
    })),
  }));

  return NextResponse.json({ clients });
}
