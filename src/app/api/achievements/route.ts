import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goalId, actual, period, status } = body;

    if (!goalId || !actual || !period || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert the achievement for the given goal and period
    const achievement = await prisma.achievement.upsert({
      where: {
        goalId_period: {
          goalId,
          period,
        },
      },
      update: {
        actual,
        status,
      },
      create: {
        goalId,
        actual,
        period,
        status,
      },
    });

    return NextResponse.json(achievement, { status: 201 });
  } catch (error) {
    console.error('Failed to log achievement', error);
    return NextResponse.json({ error: 'Failed to log achievement' }, { status: 500 });
  }
}
