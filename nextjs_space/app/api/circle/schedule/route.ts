import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/circle/schedule?therapistId=xxx  — fetch schedule for a therapist (used by parent dashboard too)
export async function GET(req: NextRequest) {
  try {
    const therapistId = req.nextUrl.searchParams.get('therapistId');
    if (!therapistId) return NextResponse.json({ schedule: [] });

    const schedule = await prisma.circleTimeSchedule.findMany({
      where: { therapistId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { timeOfDay: 'asc' }],
    });

    return NextResponse.json({ schedule });
  } catch {
    return NextResponse.json({ schedule: [] });
  }
}

// POST /api/circle/schedule — create a schedule entry (therapist only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const therapistId = (session?.user as any)?.id;
    if (!therapistId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dayOfWeek, timeOfDay, title, activityId, notes } = await req.json();
    if (dayOfWeek === undefined || !timeOfDay || !title) {
      return NextResponse.json({ error: 'dayOfWeek, timeOfDay and title are required' }, { status: 400 });
    }

    const entry = await prisma.circleTimeSchedule.create({
      data: { therapistId, dayOfWeek, timeOfDay, title, activityId: activityId || null, notes: notes || null },
    });

    return NextResponse.json({ entry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/circle/schedule?id=xxx — remove a schedule entry (therapist only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const therapistId = (session?.user as any)?.id;
    if (!therapistId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.circleTimeSchedule.deleteMany({ where: { id, therapistId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
