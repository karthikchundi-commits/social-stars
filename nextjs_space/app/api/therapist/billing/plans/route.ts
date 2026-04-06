import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: all plans for this therapist
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plans = await prisma.therapistSubscriptionPlan.findMany({
    where: { therapistId: userId },
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ plans });
}

// POST: create a new plan
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, pricePerMonth, features } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const plan = await prisma.therapistSubscriptionPlan.create({
    data: {
      therapistId: userId,
      name,
      description: description ?? null,
      pricePerMonth: pricePerMonth ?? 0,
      features: JSON.stringify(features ?? []),
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}

// PATCH: update a plan
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, description, pricePerMonth, features, isActive } = await request.json();
  if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

  const plan = await prisma.therapistSubscriptionPlan.findFirst({ where: { id, therapistId: userId } });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.therapistSubscriptionPlan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(pricePerMonth !== undefined && { pricePerMonth }),
      ...(features !== undefined && { features: JSON.stringify(features) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ plan: updated });
}

// DELETE: remove a plan
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const plan = await prisma.therapistSubscriptionPlan.findFirst({ where: { id, therapistId: userId } });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.therapistSubscriptionPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
