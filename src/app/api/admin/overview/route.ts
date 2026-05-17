import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Admin overview: completion stats across all employees
export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: {
        goals: { include: { achievements: true } },
        checkIns: true,
      },
    });

    const totalGoals = await prisma.goal.count();
    const approvedGoals = await prisma.goal.count({ where: { status: 'APPROVED' } });
    const draftGoals = await prisma.goal.count({ where: { status: 'DRAFT' } });
    const rejectedGoals = await prisma.goal.count({ where: { status: 'REJECTED' } });
    const totalAchievements = await prisma.achievement.count();
    const completedAchievements = await prisma.achievement.count({ where: { status: 'COMPLETED' } });
    const totalCheckIns = await prisma.checkIn.count();

    const employeeStats = employees.map((emp) => {
      const totalWeight = emp.goals.reduce((acc, g) => acc + g.weightage, 0);
      const approvedCount = emp.goals.filter((g) => g.status === 'APPROVED').length;
      const achievementCount = emp.goals.reduce((acc, g) => acc + g.achievements.length, 0);
      const completedCount = emp.goals.reduce(
        (acc, g) => acc + g.achievements.filter((a) => a.status === 'COMPLETED').length,
        0
      );

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        totalGoals: emp.goals.length,
        approvedGoals: approvedCount,
        totalWeightage: totalWeight,
        achievements: achievementCount,
        completedAchievements: completedCount,
        checkIns: emp.checkIns.length,
        goalsFilled: totalWeight === 100,
      };
    });

    return NextResponse.json({
      summary: {
        totalEmployees: employees.length,
        totalGoals,
        approvedGoals,
        draftGoals,
        rejectedGoals,
        totalAchievements,
        completedAchievements,
        totalCheckIns,
      },
      employees: employeeStats,
    });
  } catch (error) {
    console.error('Failed to fetch overview', error);
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}
