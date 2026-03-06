import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
    }

    const checkIns = await prisma.moodCheckIn.findMany({
      where: { childId },
      orderBy: { checkedAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('Error fetching mood check-ins:', error);
    return NextResponse.json({ error: 'Failed to fetch mood check-ins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, mood } = body;

    if (!childId || !mood) {
      return NextResponse.json({ error: 'childId and mood are required' }, { status: 400 });
    }

    const checkIn = await prisma.moodCheckIn.create({
      data: { childId, mood },
    });

    return NextResponse.json({ checkIn }, { status: 201 });
  } catch (error) {
    console.error('Error creating mood check-in:', error);
    return NextResponse.json({ error: 'Failed to save mood check-in' }, { status: 500 });
  }
}
