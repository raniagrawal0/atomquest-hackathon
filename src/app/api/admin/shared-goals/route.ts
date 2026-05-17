import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Push a shared goal to all employees
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, thrustArea, uom, target, weightage } = body;

    if (!title || !thrustArea || !uom || !target || !weightage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedWeightage = parseInt(weightage as string, 10);

    // Get all employees
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
    });

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No employees found' }, { status: 400 });
    }

    // Create a goal for each employee
    const results = await Promise.all(
      employees.map(async (emp) => {
        // Check if adding this won't exceed 100%
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

    return NextResponse.json({ message: 'Shared goal pushed', results }, { status: 201 });
  } catch (error) {
    console.error('Failed to push shared goal', error);
    return NextResponse.json({ error: 'Failed to push shared goal' }, { status: 500 });
  }
}
