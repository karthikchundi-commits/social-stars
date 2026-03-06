import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, content } = await request.json();
  if (!title || !description || !content) {
    return NextResponse.json({ error: 'title, description, and content are required' }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      type: 'story',
      content: typeof content === 'string' ? content : JSON.stringify(content),
      difficulty: 2,
      starsReward: 3,
      createdBy: userId,
    },
  });

  return NextResponse.json({ activity }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('id');
  if (!activityId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.createdBy !== userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
  }

  await prisma.activity.delete({ where: { id: activityId } });
  return NextResponse.json({ success: true });
}
