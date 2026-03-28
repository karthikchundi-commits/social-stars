import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all children linked to this therapist
  const families = await prisma.therapistFamily.findMany({
    where: { therapistId: userId },
    include: { parent: { include: { children: true } } },
  });

  const children = families.flatMap(f => f.parent.children);
  const childIds = children.map(c => c.id);

  // Get confusion events from last 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const events = await prisma.confusionEvent.findMany({
    where: { childId: { in: childIds }, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' },
  });

  // Group by child
  const byChild: Record<string, { wrongAnswers: number; hesitations: number; activityTypes: string[]; lastEvent: string }> = {};
  for (const e of events) {
    if (!byChild[e.childId]) byChild[e.childId] = { wrongAnswers: 0, hesitations: 0, activityTypes: [], lastEvent: e.timestamp.toISOString() };
    if (e.eventType === 'wrong_answer') byChild[e.childId].wrongAnswers++;
    if (e.eventType === 'hesitation') byChild[e.childId].hesitations++;
    if (!byChild[e.childId].activityTypes.includes(e.activityType)) byChild[e.childId].activityTypes.push(e.activityType);
  }

  const struggles = children
    .filter(c => byChild[c.id] && (byChild[c.id].wrongAnswers >= 3 || byChild[c.id].hesitations >= 2))
    .map(c => ({ childId: c.id, childName: c.name, avatarColor: c.avatarColor, ...byChild[c.id] }));

  return NextResponse.json({ struggles });
}
