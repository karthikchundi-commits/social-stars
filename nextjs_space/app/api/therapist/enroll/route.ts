import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: list all enrollments for this therapist
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Not a therapist account' }, { status: 403 });
  }

  const enrollments = await prisma.prospectEnrollment.findMany({
    where: { therapistId: userId },
    include: { children: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ enrollments });
}

// POST: create a new enrollment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Not a therapist account' }, { status: 403 });
  }

  const { parentName, parentEmail, children, notes, goals } = await request.json();
  if (!parentName || !parentEmail || !children?.length) {
    return NextResponse.json({ error: 'Parent name, email, and at least one child are required' }, { status: 400 });
  }

  const token = `ENR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const enrollment = await prisma.prospectEnrollment.create({
    data: {
      therapistId: userId,
      parentName,
      parentEmail,
      token,
      notes,
      goals,
      children: {
        create: children.map((c: { name: string; age: number; notes?: string }) => ({
          name: c.name,
          age: Number(c.age),
          notes: c.notes,
        })),
      },
    },
    include: { children: true },
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}
