import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user (Faisal)
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "faisal@mercylink.com" },
    update: {},
    create: {
      email: "faisal@mercylink.com",
      password: adminPassword,
      name: "Faisal",
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create DM user (Brittany)
  const dm = await prisma.user.upsert({
    where: { email: "brittany@mercylink.com" },
    update: {},
    create: {
      email: "brittany@mercylink.com",
      password: adminPassword,
      name: "Brittany",
      role: "ADMIN",
    },
  });
  console.log("Created DM user:", dm.email);

  // Create houses (8 CRS locations)
  const housesData = [
    { name: "Cedar House", address: "1234 Cedar Ave, Burnsville, MN 55337", county: "Dakota" },
    { name: "Maple House", address: "5678 Maple St, Apple Valley, MN 55124", county: "Dakota" },
    { name: "Oak House", address: "9012 Oak Blvd, Eagan, MN 55122", county: "Dakota" },
    { name: "Pine House", address: "3456 Pine Rd, Lakeville, MN 55044", county: "Dakota" },
    { name: "Birch House", address: "7890 Birch Ln, Bloomington, MN 55420", county: "Hennepin" },
    { name: "Elm House", address: "2345 Elm Way, Richfield, MN 55423", county: "Hennepin" },
    { name: "Willow House", address: "6789 Willow Dr, Eden Prairie, MN 55344", county: "Hennepin" },
    { name: "Spruce House", address: "1357 Spruce Ct, Minnetonka, MN 55345", county: "Hennepin" },
  ];

  const houses = [];
  for (const houseData of housesData) {
    const house = await prisma.house.upsert({
      where: { id: houseData.name.toLowerCase().replace(" ", "-") },
      update: {},
      create: {
        id: houseData.name.toLowerCase().replace(" ", "-"),
        ...houseData,
        licenseNumber: `245D-${Math.floor(Math.random() * 900000) + 100000}`,
        capacity: 4,
      },
    });
    houses.push(house);
  }
  console.log(`Created ${houses.length} houses`);

  // Create sample clients (2 per house)
  const today = new Date();
  const clientNames = [
    ["John", "Anderson"], ["Mary", "Johnson"], ["Robert", "Williams"], ["Patricia", "Brown"],
    ["Michael", "Jones"], ["Jennifer", "Garcia"], ["William", "Miller"], ["Linda", "Davis"],
    ["David", "Rodriguez"], ["Barbara", "Martinez"], ["Richard", "Hernandez"], ["Susan", "Lopez"],
    ["Joseph", "Gonzalez"], ["Jessica", "Wilson"], ["Thomas", "Moore"], ["Sarah", "Taylor"],
  ];

  let clientIndex = 0;
  for (const house of houses) {
    for (let i = 0; i < 2; i++) {
      const [firstName, lastName] = clientNames[clientIndex];
      const admissionDate = subDays(today, Math.floor(Math.random() * 365) + 30);

      const client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          dob: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          admissionDate,
          houseId: house.id,
          caseManagerName: `CM ${lastName}`,
          caseManagerEmail: `cm.${lastName.toLowerCase()}@county.gov`,
          caseManagerPhone: `(612) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          waiverType: ["DD", "CADI", "BI"][Math.floor(Math.random() * 3)],
          status: "ACTIVE",
        },
      });

      // Create compliance items for client based on 245D requirements
      const complianceItems = [
        { itemType: "ABUSE_PREVENTION_PLAN", itemName: "Abuse Prevention Plan", daysFromAdmission: 0, statuteRef: "245D.071, Subd. 2" },
        { itemType: "PRELIMINARY_CSSP", itemName: "Preliminary CSSP Addendum", daysFromAdmission: 15, statuteRef: "245D.071, Subd. 3(a)" },
        { itemType: "FUNCTIONAL_ASSESSMENT", itemName: "Functional Assessment", daysFromAdmission: 60, statuteRef: "245D.071, Subd. 3(b)" },
        { itemType: "PLANNING_MEETING_45_DAY", itemName: "45/60-Day Planning Meeting", daysFromAdmission: 60, statuteRef: "245D.071, Subd. 3(c)" },
        { itemType: "SERVICE_PLAN_CSSP", itemName: "Service Plan (CSSP Addendum)", daysFromAdmission: 74, statuteRef: "245D.071, Subd. 4(a)" },
        { itemType: "SERVICE_RECIPIENT_RIGHTS", itemName: "Service Recipient Rights Review", daysFromAdmission: 0, statuteRef: "245D.04" },
      ];

      for (const item of complianceItems) {
        const dueDate = addDays(admissionDate, item.daysFromAdmission);
        const isOverdue = dueDate < today;
        const isCompleted = Math.random() > 0.3; // 70% completion rate

        await prisma.complianceItem.create({
          data: {
            entityType: "CLIENT",
            itemType: item.itemType,
            itemName: item.itemName,
            dueDate,
            completedDate: isCompleted ? subDays(dueDate, Math.floor(Math.random() * 5)) : null,
            status: isCompleted ? "COMPLETED" : (isOverdue ? "OVERDUE" : "PENDING"),
            statuteRef: item.statuteRef,
            clientId: client.id,
          },
        });
      }

      // Add quarterly progress reviews
      const quartersSinceAdmission = Math.floor((today.getTime() - admissionDate.getTime()) / (90 * 24 * 60 * 60 * 1000));
      for (let q = 1; q <= Math.min(quartersSinceAdmission + 1, 4); q++) {
        const dueDate = addDays(admissionDate, q * 90);
        const isOverdue = dueDate < today;
        const isCompleted = dueDate < today && Math.random() > 0.2;

        await prisma.complianceItem.create({
          data: {
            entityType: "CLIENT",
            itemType: "PROGRESS_REVIEW",
            itemName: `Q${q} Progress Review`,
            dueDate,
            completedDate: isCompleted ? subDays(dueDate, Math.floor(Math.random() * 3)) : null,
            status: isCompleted ? "COMPLETED" : (isOverdue ? "OVERDUE" : "PENDING"),
            statuteRef: "245D.071, Subd. 5",
            clientId: client.id,
          },
        });
      }

      clientIndex++;
    }
  }
  console.log("Created clients with compliance items");

  // Create sample employees
  const employeeNames = [
    ["Alex", "Thompson", "DSP"], ["Jordan", "White", "DSP"], ["Casey", "Harris", "LEAD_DSP"],
    ["Morgan", "Clark", "DSP"], ["Taylor", "Lewis", "DSP"], ["Riley", "Walker", "LEAD_DSP"],
    ["Avery", "Hall", "DSP"], ["Quinn", "Allen", "DSP"], ["Skyler", "Young", "DC"],
    ["Jamie", "King", "DSP"], ["Drew", "Wright", "DSP"], ["Cameron", "Scott", "LEAD_DSP"],
  ];

  for (let i = 0; i < employeeNames.length; i++) {
    const [firstName, lastName, position] = employeeNames[i];
    const hireDate = subDays(today, Math.floor(Math.random() * 730) + 60); // 2 months to 2 years ago
    const experienceYears = Math.floor(Math.random() * 8);

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mercylink.com`,
        phone: `(651) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        hireDate,
        position,
        experienceYears,
        status: "ACTIVE",
      },
    });

    // Assign to 1-2 houses
    const numHouses = Math.floor(Math.random() * 2) + 1;
    const shuffledHouses = [...houses].sort(() => Math.random() - 0.5);
    for (let h = 0; h < numHouses; h++) {
      await prisma.employeeHouse.create({
        data: {
          employeeId: employee.id,
          houseId: shuffledHouses[h].id,
        },
      });
    }

    // Create employee compliance items
    const empComplianceItems = [
      { itemType: "BACKGROUND_STUDY", itemName: "Background Study (NETStudy 2.0)", daysFromHire: 0, statuteRef: "245C.04" },
      { itemType: "MALTREATMENT_TRAINING", itemName: "Maltreatment Reporting Training", daysFromHire: 3, statuteRef: "245D.09, Subd. 4(5)" },
      { itemType: "ORIENTATION_TRAINING", itemName: "Orientation Training (Intensive)", daysFromHire: 60, statuteRef: "245D.09, Subd. 4" },
      { itemType: "FIRST_AID_CPR", itemName: "First Aid/CPR Certification", daysFromHire: 30, statuteRef: "245D.09, Subd. 4(9)" },
    ];

    for (const item of empComplianceItems) {
      const dueDate = addDays(hireDate, item.daysFromHire);
      const isOverdue = dueDate < today;
      const isCompleted = Math.random() > 0.25;

      await prisma.complianceItem.create({
        data: {
          entityType: "EMPLOYEE",
          itemType: item.itemType,
          itemName: item.itemName,
          dueDate,
          completedDate: isCompleted ? subDays(dueDate, Math.floor(Math.random() * 5)) : null,
          status: isCompleted ? "COMPLETED" : (isOverdue ? "OVERDUE" : "PENDING"),
          statuteRef: item.statuteRef,
          employeeId: employee.id,
        },
      });
    }

    // Annual training requirement (calculate from hire anniversary)
    const annualTrainingHours = experienceYears >= 5 ? 12 : 24;
    const anniversaryThisYear = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
    const nextAnniversary = anniversaryThisYear < today ? addDays(anniversaryThisYear, 365) : anniversaryThisYear;

    await prisma.complianceItem.create({
      data: {
        entityType: "EMPLOYEE",
        itemType: "ANNUAL_TRAINING",
        itemName: `Annual Training (${annualTrainingHours} hours)`,
        dueDate: nextAnniversary,
        status: "PENDING",
        statuteRef: "245D.09, Subd. 5",
        employeeId: employee.id,
      },
    });
  }
  console.log("Created employees with compliance items");

  // Create DC user and assign to houses
  const dcPassword = await hash("dc123", 12);
  const dc = await prisma.user.upsert({
    where: { email: "dc@mercylink.com" },
    update: {},
    create: {
      email: "dc@mercylink.com",
      password: dcPassword,
      name: "Test DC",
      role: "DESIGNATED_COORDINATOR",
    },
  });

  // Assign DC to first 4 houses
  for (let i = 0; i < 4; i++) {
    await prisma.userHouse.create({
      data: {
        userId: dc.id,
        houseId: houses[i].id,
      },
    });
  }
  console.log("Created DC user:", dc.email);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
