import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const orConditions: any[] = [{ createdBy: null }];

    if (userId) {
      // Include activities created by this user
      orConditions.push({ createdBy: userId });
    }

    const activities = await prisma.activity.findMany({
      where: { OR: orConditions },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
