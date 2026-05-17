import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, locked, target, weightage } = body;

    const updatedGoal = await prisma.goal.update({
      where: { id: id },
      data: {
        ...(status && { status }),
        ...(locked !== undefined && { locked }),
        ...(target && { target }),
        ...(weightage && { weightage: parseInt(weightage) })
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: 'MANAGER',
        changes: `MANAGER_ACTION: ${status ? `status→${status}` : ''} ${locked !== undefined ? `locked→${locked}` : ''} ${target ? `target→${target}` : ''} ${weightage ? `weightage→${weightage}` : ''}`.trim(),
        goalId: id,
      },
    });

    return NextResponse.json(updatedGoal, { status: 200 });
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
