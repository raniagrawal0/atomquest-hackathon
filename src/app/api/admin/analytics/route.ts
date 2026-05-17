import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        achievements: true,
      },
    });

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: {
        manager: true,
        checkIns: true,
      },
    });

    // 1. Goal Distribution by Thrust Area
    const thrustAreaMap: Record<string, number> = {};
    goals.forEach((g) => {
      thrustAreaMap[g.thrustArea] = (thrustAreaMap[g.thrustArea] || 0) + 1;
    });
    const thrustAreaData = Object.keys(thrustAreaMap).map((key) => ({
      name: key,
      value: thrustAreaMap[key],
    }));

    // 2. Goal Distribution by UoM
    const uomMap: Record<string, number> = {};
    goals.forEach((g) => {
      uomMap[g.uom] = (uomMap[g.uom] || 0) + 1;
    });
    const uomData = Object.keys(uomMap).map((key) => ({
      name: key,
      value: uomMap[key],
    }));

    // 3. QoQ Achievement Trends
    const qoqMap: Record<string, { total: number; completed: number }> = {
      Q1: { total: 0, completed: 0 },
      Q2: { total: 0, completed: 0 },
      Q3: { total: 0, completed: 0 },
      Q4: { total: 0, completed: 0 },
    };

    goals.forEach((g) => {
      g.achievements.forEach((a) => {
        if (qoqMap[a.period]) {
          qoqMap[a.period].total += 1;
          if (a.status === 'COMPLETED') {
            qoqMap[a.period].completed += 1;
          }
        }
      });
    });

    const qoqData = Object.keys(qoqMap).map((period) => ({
      period,
      Logged: qoqMap[period].total,
      Completed: qoqMap[period].completed,
    }));

    // 4. Manager Effectiveness (Check-ins per Manager)
    const managerMap: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.manager) {
        const managerName = emp.manager.name;
        managerMap[managerName] = (managerMap[managerName] || 0) + emp.checkIns.length;
      }
    });

    const managerData = Object.keys(managerMap).map((name) => ({
      name,
      checkIns: managerMap[name],
    }));

    return NextResponse.json({
      thrustAreaData,
      uomData,
      qoqData,
      managerData,
    });
  } catch (error) {
    console.error('Failed to fetch analytics', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
