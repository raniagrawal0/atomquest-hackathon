import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, managerId, period, comment } = body;

    if (!employeeId || !managerId || !period || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert the checkin for the given employee and period
    const checkIn = await prisma.checkIn.upsert({
      where: {
        employeeId_period: {
          employeeId,
          period,
        },
      },
      update: {
        comment,
      },
      create: {
        employeeId,
        managerId,
        period,
        comment,
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error('Failed to log check-in', error);
    return NextResponse.json({ error: 'Failed to log check-in' }, { status: 500 });
  }
}
