import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET: fetch enrollment details by token (public — for parent to see pre-filled info)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const enrollment = await prisma.prospectEnrollment.findUnique({
    where: { token },
    include: {
      children: true,
      therapist: { select: { name: true, email: true } },
    },
  });

  if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment link' }, { status: 404 });
  if (enrollment.status === 'completed') return NextResponse.json({ error: 'This enrollment has already been completed' }, { status: 410 });

  return NextResponse.json({
    enrollment: {
      token: enrollment.token,
      parentName: enrollment.parentName,
      parentEmail: enrollment.parentEmail,
      therapistName: enrollment.therapist.name,
      goals: enrollment.goals,
      children: enrollment.children.map((c) => ({ name: c.name, age: c.age, notes: c.notes })),
    },
  });
}

// POST: parent completes registration via enrollment link
export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || !password) return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const enrollment = await prisma.prospectEnrollment.findUnique({
    where: { token },
    include: { children: true, therapist: true },
  });

  if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment link' }, { status: 404 });
  if (enrollment.status === 'completed') return NextResponse.json({ error: 'Already completed' }, { status: 410 });

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: enrollment.parentEmail } });
  if (existing) return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create parent account + children + therapist link in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const parent = await tx.user.create({
      data: {
        name: enrollment.parentName,
        email: enrollment.parentEmail,
        password: hashedPassword,
        role: 'parent',
      },
    });

    // Create child profiles from enrollment data
    for (const child of enrollment.children) {
      await tx.childProfile.create({
        data: {
          name: child.name,
          age: child.age,
          userId: parent.id,
        },
      });
    }

    // Link parent to therapist
    await tx.therapistFamily.create({
      data: {
        therapistId: enrollment.therapistId,
        parentId: parent.id,
      },
    });

    // Mark enrollment as completed
    await tx.prospectEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    return parent;
  });

  return NextResponse.json({ success: true, email: result.email }, { status: 201 });
}
