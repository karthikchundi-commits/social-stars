import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let subscription = await prisma.familySubscription.findUnique({
    where: { parentId: userId },
    include: {
      plan: true,
      therapist: { select: { id: true, name: true, email: true, city: true, state: true, country: true } },
    },
  });

  // Fallback: parent enrolled via therapist but no FamilySubscription row yet
  // (e.g. enrolled before this feature was added). Create one now.
  if (!subscription) {
    const therapistLink = await prisma.therapistFamily.findFirst({
      where: { parentId: userId },
      include: {
        therapist: { select: { id: true, name: true, email: true, city: true, state: true, country: true } },
      },
      orderBy: { linkedAt: 'desc' },
    });

    if (therapistLink) {
      subscription = await prisma.familySubscription.create({
        data: {
          parentId: userId,
          therapistId: therapistLink.therapistId,
          status: 'active',
        },
        include: {
          plan: true,
          therapist: { select: { id: true, name: true, email: true, city: true, state: true, country: true } },
        },
      });
    }
  }

  if (!subscription) return NextResponse.json({ subscription: null });

  // Calculate effective price after discount
  const basePrice = subscription.customPrice ?? subscription.plan?.pricePerMonth ?? 0;
  const effectivePrice = basePrice * (1 - subscription.discountPercent / 100);

  return NextResponse.json({
    subscription: {
      ...subscription,
      features: subscription.plan ? JSON.parse(subscription.plan.features) : [],
      basePrice,
      effectivePrice,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await request.json();
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

  const subscription = await prisma.familySubscription.findUnique({
    where: { parentId: userId },
  });
  if (!subscription) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

  // Verify the plan belongs to the therapist linked to this parent
  const plan = await prisma.therapistSubscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan || plan.therapistId !== subscription.therapistId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 403 });
  }

  const updated = await prisma.familySubscription.update({
    where: { parentId: userId },
    data: { planId },
    include: {
      plan: true,
      therapist: { select: { id: true, name: true, email: true, city: true, state: true, country: true } },
    },
  });

  const basePrice = updated.customPrice ?? updated.plan?.pricePerMonth ?? 0;
  const effectivePrice = basePrice * (1 - updated.discountPercent / 100);

  return NextResponse.json({
    subscription: {
      ...updated,
      features: updated.plan ? JSON.parse(updated.plan.features) : [],
      basePrice,
      effectivePrice,
    },
  });
}
