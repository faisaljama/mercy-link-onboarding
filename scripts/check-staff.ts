import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all houses
  const houses = await prisma.house.findMany({
    select: { id: true, name: true }
  });
  console.log('\n=== HOUSES ===');
  houses.forEach(h => console.log('  ' + h.name + ' (' + h.id + ')'));

  // Get all employees
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      assignedHouses: {
        include: { house: { select: { name: true } } }
      }
    }
  });

  console.log('\n=== EMPLOYEES ===');
  employees.forEach(e => {
    const houseNames = e.assignedHouses.map(ah => ah.house.name).join(', ') || 'NO HOUSES ASSIGNED';
    console.log('  ' + e.firstName + ' ' + e.lastName + ' (' + e.status + ') - Houses: ' + houseNames);
  });

  // Count employees with house assignments
  const withHouses = employees.filter(e => e.assignedHouses.length > 0);
  console.log('\n=== SUMMARY ===');
  console.log('  Total employees: ' + employees.length);
  console.log('  With house assignments: ' + withHouses.length);
  console.log('  Without house assignments: ' + (employees.length - withHouses.length));
}

main().catch(console.error).finally(() => prisma.$disconnect());
