import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const discounts = await prisma.groupDiscount.findMany({
    where: { therapistId: userId },
    include: { plan: { select: { id: true, name: true } } },
    orderBy: { minFamilies: 'asc' },
  });

  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, minFamilies, discountPercent, planId } = await request.json();
  if (!name || !minFamilies || !discountPercent) {
    return NextResponse.json({ error: 'name, minFamilies and discountPercent required' }, { status: 400 });
  }

  const discount = await prisma.groupDiscount.create({
    data: {
      therapistId: userId,
      name,
      minFamilies: Number(minFamilies),
      discountPercent: Number(discountPercent),
      planId: planId ?? null,
    },
    include: { plan: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ discount }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, minFamilies, discountPercent, planId, isActive } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const existing = await prisma.groupDiscount.findFirst({ where: { id, therapistId: userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.groupDiscount.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(minFamilies !== undefined && { minFamilies: Number(minFamilies) }),
      ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
      ...(planId !== undefined && { planId }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { plan: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ discount: updated });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const existing = await prisma.groupDiscount.findFirst({ where: { id, therapistId: userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.groupDiscount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
