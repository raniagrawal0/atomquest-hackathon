import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Admin: Get all goals across all employees
export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        employee: true,
        achievements: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch all goals', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// Admin: Override/intervene on any goal (unlock, edit, change status)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { goalId, status, locked, target, weightage } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(status && { status }),
        ...(locked !== undefined && { locked }),
        ...(target && { target }),
        ...(weightage && { weightage: parseInt(weightage as string, 10) }),
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: 'ADMIN',
        changes: `ADMIN_INTERVENTION: ${status ? `status→${status}` : ''} ${locked !== undefined ? `locked→${locked}` : ''} ${target ? `target→${target}` : ''} ${weightage ? `weightage→${weightage}` : ''}`.trim(),
        goalId,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
