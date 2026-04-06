import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: all family subscriptions for this therapist
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all families linked to this therapist
  const families = await prisma.therapistFamily.findMany({
    where: { therapistId: userId },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
          mySubscription: {
            include: { plan: true },
          },
        },
      },
    },
    orderBy: { linkedAt: 'desc' },
  });

  // Count active families for group discount calculation
  const activeFamilyCount = families.length;

  // Get applicable group discounts
  const groupDiscounts = await prisma.groupDiscount.findMany({
    where: { therapistId: userId, isActive: true },
    orderBy: { minFamilies: 'desc' },
  });

  const applicableGroupDiscount = groupDiscounts.find(
    (gd) => activeFamilyCount >= gd.minFamilies
  );

  return NextResponse.json({
    families: families.map((f) => ({
      therapistFamilyId: f.id,
      parentId: f.parent.id,
      parentName: f.parent.name,
      parentEmail: f.parent.email,
      linkedAt: f.linkedAt,
      subscription: f.parent.mySubscription,
    })),
    activeFamilyCount,
    applicableGroupDiscount,
  });
}

// POST: assign/create a subscription for a family
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { parentId, planId, discountPercent, customPrice, notes } = await request.json();
  if (!parentId) return NextResponse.json({ error: 'Parent ID required' }, { status: 400 });

  // Verify this parent is linked to the therapist
  const link = await prisma.therapistFamily.findFirst({ where: { therapistId: userId, parentId } });
  if (!link) return NextResponse.json({ error: 'Family not linked' }, { status: 403 });

  const subscription = await prisma.familySubscription.upsert({
    where: { parentId },
    create: {
      parentId,
      therapistId: userId,
      planId: planId ?? null,
      discountPercent: discountPercent ?? 0,
      customPrice: customPrice ?? null,
      notes: notes ?? null,
    },
    update: {
      therapistId: userId,
      planId: planId ?? null,
      discountPercent: discountPercent ?? 0,
      customPrice: customPrice ?? null,
      notes: notes ?? null,
    },
    include: { plan: true },
  });

  return NextResponse.json({ subscription });
}

// PATCH: update subscription status or discount
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { parentId, planId, discountPercent, customPrice, status, notes } = await request.json();
  if (!parentId) return NextResponse.json({ error: 'Parent ID required' }, { status: 400 });

  const existing = await prisma.familySubscription.findFirst({ where: { parentId, therapistId: userId } });
  if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  const updated = await prisma.familySubscription.update({
    where: { parentId },
    data: {
      ...(planId !== undefined && { planId }),
      ...(discountPercent !== undefined && { discountPercent }),
      ...(customPrice !== undefined && { customPrice }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: { plan: true },
  });

  return NextResponse.json({ subscription: updated });
}
