import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await prisma.familySubscription.findUnique({
    where: { parentId: userId },
    include: {
      plan: true,
      therapist: { select: { id: true, name: true, email: true, city: true, state: true, country: true } },
    },
  });

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
