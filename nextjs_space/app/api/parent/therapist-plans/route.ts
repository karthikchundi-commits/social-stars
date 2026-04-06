import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: fetch a therapist's active subscription plans (for parents to view)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const therapistId = searchParams.get('therapistId');
  if (!therapistId) return NextResponse.json({ error: 'therapistId required' }, { status: 400 });

  // Verify this parent is actually linked to this therapist
  const link = await prisma.therapistFamily.findFirst({
    where: { therapistId, parentId: userId },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this therapist' }, { status: 403 });

  const plans = await prisma.therapistSubscriptionPlan.findMany({
    where: { therapistId, isActive: true },
    orderBy: { pricePerMonth: 'asc' },
  });

  return NextResponse.json({ plans });
}
