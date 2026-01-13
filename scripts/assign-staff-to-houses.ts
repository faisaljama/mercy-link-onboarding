import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all houses
  const houses = await prisma.house.findMany({
    select: { id: true, name: true }
  });
  console.log('Found ' + houses.length + ' houses');

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true }
  });
  console.log('Found ' + employees.length + ' active employees');

  // Assign each employee to each house
  let created = 0;
  let skipped = 0;

  for (const employee of employees) {
    for (const house of houses) {
      try {
        await prisma.employeeHouse.create({
          data: {
            employeeId: employee.id,
            houseId: house.id,
          }
        });
        created++;
      } catch (e: any) {
        // Already exists (unique constraint)
        if (e.code === 'P2002') {
          skipped++;
        } else {
          console.error('Error assigning ' + employee.firstName + ' to ' + house.name + ': ' + e.message);
        }
      }
    }
  }

  console.log('\n=== DONE ===');
  console.log('Created ' + created + ' new assignments');
  console.log('Skipped ' + skipped + ' (already existed)');
  console.log('\nAll employees can now work at all houses!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
