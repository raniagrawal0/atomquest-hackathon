import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Manager: Push a shared/departmental goal to their direct reports
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { managerId, title, description, thrustArea, uom, target, weightage } = body;

    if (!managerId || !title || !thrustArea || !uom || !target || !weightage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedWeightage = parseInt(weightage as string, 10);

    // Get all employees reporting to this manager
    const employees = await prisma.user.findMany({
      where: { managerId },
    });

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No direct reports found' }, { status: 400 });
    }

    const results = await Promise.all(
      employees.map(async (emp) => {
        const existingGoals = await prisma.goal.findMany({ where: { employeeId: emp.id } });
        const currentTotal = existingGoals.reduce((acc, g) => acc + g.weightage, 0);

        if (currentTotal + parsedWeightage > 100) {
          return { employee: emp.name, status: 'SKIPPED', reason: `Would exceed 100% (current: ${currentTotal}%)` };
        }
        if (existingGoals.length >= 8) {
          return { employee: emp.name, status: 'SKIPPED', reason: 'Already has 8 goals' };
        }

        const goal = await prisma.goal.create({
          data: {
            title,
            description: description || '',
            thrustArea,
            uom,
            target,
            weightage: parsedWeightage,
            status: 'APPROVED',
            locked: true,
            employeeId: emp.id,
          },
        });

        return { employee: emp.name, status: 'CREATED', goalId: goal.id };
      })
    );

    return NextResponse.json({ message: 'Departmental goal pushed to team', results }, { status: 201 });
  } catch (error) {
    console.error('Failed to push departmental goal', error);
    return NextResponse.json({ error: 'Failed to push departmental goal' }, { status: 500 });
  }
}
