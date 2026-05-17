import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        goal: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch audit logs', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
