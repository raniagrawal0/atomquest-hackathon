import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CSV Export: Achievement Report (Planned vs Actual)
export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        employee: true,
        achievements: true,
      },
    });

    // Build CSV
    const headers = ['Employee', 'Email', 'Goal Title', 'Thrust Area', 'UoM', 'Target', 'Weightage (%)', 'Status', 'Q1 Actual', 'Q1 Status', 'Q2 Actual', 'Q2 Status', 'Q3 Actual', 'Q3 Status', 'Q4 Actual', 'Q4 Status'];
    
    const rows = goals.map((goal) => {
      const getAch = (period: string) => goal.achievements.find((a) => a.period === period);
      const q1 = getAch('Q1');
      const q2 = getAch('Q2');
      const q3 = getAch('Q3');
      const q4 = getAch('Q4');

      return [
        goal.employee.name,
        goal.employee.email,
        goal.title,
        goal.thrustArea,
        goal.uom,
        goal.target,
        goal.weightage,
        goal.status,
        q1?.actual || '-',
        q1?.status || '-',
        q2?.actual || '-',
        q2?.status || '-',
        q3?.actual || '-',
        q3?.status || '-',
        q4?.actual || '-',
        q4?.status || '-',
      ].map((val) => `"${val}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="atomquest_achievement_report.csv"',
      },
    });
  } catch (error) {
    console.error('Failed to export CSV', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
