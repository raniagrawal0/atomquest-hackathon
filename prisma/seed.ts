import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomquest.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomquest.com',
      name: 'Manager User',
      role: 'MANAGER',
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@atomquest.com',
      name: 'Employee User',
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log({ admin, manager, employee });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
