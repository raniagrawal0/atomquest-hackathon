import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, thrustArea, uom, target, weightage, trackingType, employeeId } = body;

    // Validation Rules
    if (!title || !thrustArea || !uom || !target || !weightage || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedWeightage = parseInt(weightage as string, 10);

    if (parsedWeightage < 10) {
      return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 });
    }

    // Check employee current goals total weightage and count
    const employeeGoals = await prisma.goal.findMany({
      where: { employeeId },
    });

    if (employeeGoals.length >= 8) {
      return NextResponse.json({ error: 'Maximum number of goals per employee is 8' }, { status: 400 });
    }

    const currentTotalWeightage = employeeGoals.reduce((acc, goal) => acc + goal.weightage, 0);
    
    if (currentTotalWeightage + parsedWeightage > 100) {
      return NextResponse.json({ error: `Total weightage cannot exceed 100%. You can only add up to ${100 - currentTotalWeightage}%` }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        thrustArea,
        uom,
        trackingType: trackingType || 'MIN',
        target,
        weightage: parsedWeightage,
        employeeId,
      },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
