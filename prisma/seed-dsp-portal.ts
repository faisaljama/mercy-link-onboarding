import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample chores by category
const SAMPLE_CHORES = [
  // Room Checks
  { name: "Morning room check", description: "Check all resident rooms - beds made, floors clear, windows secure", category: "room_checks", shifts: ["day"], isRequired: true },
  { name: "Evening room check", description: "Check all resident rooms before night shift", category: "room_checks", shifts: ["evening"], isRequired: true },
  { name: "Overnight room check", description: "Hourly room checks - verify residents are safe", category: "room_checks", shifts: ["overnight"], isRequired: true },

  // Common Areas
  { name: "Living room tidy", description: "Straighten furniture, fluff pillows, clear clutter", category: "common_areas", shifts: ["day", "evening"], isRequired: false },
  { name: "Vacuum common areas", description: "Vacuum living room, hallways, and dining area", category: "common_areas", shifts: ["day"], isRequired: true },
  { name: "Mop floors", description: "Mop kitchen, bathroom, and entry floors", category: "common_areas", shifts: ["evening"], isRequired: true },
  { name: "Empty trash cans", description: "Empty all trash cans in common areas", category: "common_areas", shifts: ["day", "evening"], isRequired: true },
  { name: "Wipe down surfaces", description: "Disinfect door handles, light switches, and high-touch surfaces", category: "common_areas", shifts: ["day", "evening"], isRequired: true },

  // Kitchen & Meals
  { name: "Prepare breakfast", description: "Prepare and serve breakfast according to dietary needs", category: "kitchen_meals", shifts: ["day"], isRequired: true },
  { name: "Prepare lunch", description: "Prepare and serve lunch according to dietary needs", category: "kitchen_meals", shifts: ["day"], isRequired: true },
  { name: "Prepare dinner", description: "Prepare and serve dinner according to dietary needs", category: "kitchen_meals", shifts: ["evening"], isRequired: true },
  { name: "Clean kitchen after meals", description: "Wash dishes, wipe counters, clean stove", category: "kitchen_meals", shifts: ["day", "evening"], isRequired: true },
  { name: "Check refrigerator", description: "Check expiration dates, organize, remove old items", category: "kitchen_meals", shifts: ["day"], isRequired: false },
  { name: "Prepare snacks", description: "Set out evening snacks for residents", category: "kitchen_meals", shifts: ["evening"], isRequired: false },

  // Medication Area
  { name: "Morning medication administration", description: "Administer AM medications per MAR", category: "medication_area", shifts: ["day"], isRequired: true },
  { name: "Afternoon medication administration", description: "Administer afternoon medications per MAR", category: "medication_area", shifts: ["day"], isRequired: true },
  { name: "Evening medication administration", description: "Administer PM medications per MAR", category: "medication_area", shifts: ["evening"], isRequired: true },
  { name: "Bedtime medication administration", description: "Administer HS medications per MAR", category: "medication_area", shifts: ["evening", "overnight"], isRequired: true },
  { name: "Medication area cleanup", description: "Organize med cart, wipe down surfaces, check supplies", category: "medication_area", shifts: ["day"], isRequired: true, requiresPhoto: true },
  { name: "Controlled substance count", description: "Count and document all controlled substances", category: "medication_area", shifts: ["day", "evening", "overnight"], isRequired: true },

  // Safety
  { name: "Check smoke detectors", description: "Test smoke detector functionality (weekly)", category: "safety", shifts: ["day"], isRequired: false },
  { name: "Check exterior doors", description: "Verify all exterior doors are locked", category: "safety", shifts: ["evening", "overnight"], isRequired: true },
  { name: "Check windows", description: "Verify all windows are secure", category: "safety", shifts: ["evening"], isRequired: true },
  { name: "Night security check", description: "Complete security walkthrough of entire house", category: "safety", shifts: ["overnight"], isRequired: true },
  { name: "Emergency equipment check", description: "Verify first aid kit, fire extinguisher, flashlights", category: "safety", shifts: ["day"], isRequired: false },

  // Laundry
  { name: "Start laundry loads", description: "Wash resident clothing and linens", category: "laundry", shifts: ["day", "evening"], isRequired: false },
  { name: "Fold and put away laundry", description: "Fold clean laundry and return to resident rooms", category: "laundry", shifts: ["day", "evening"], isRequired: false },
  { name: "Wash towels and linens", description: "Launder bathroom towels and bed linens", category: "laundry", shifts: ["day"], isRequired: true },

  // Other
  { name: "Complete shift log", description: "Document all activities and observations in shift log", category: "other", shifts: ["day", "evening", "overnight"], isRequired: true },
  { name: "Check mail", description: "Retrieve and distribute mail to residents", category: "other", shifts: ["day"], isRequired: false },
  { name: "Water plants", description: "Water indoor plants", category: "other", shifts: ["day"], isRequired: false },
  { name: "Shift handoff", description: "Verbal handoff with incoming staff - share important updates", category: "other", shifts: ["day", "evening", "overnight"], isRequired: true },
];

// Sample DSP Documents
const SAMPLE_DOCUMENTS = [
  // Organization-wide policies
  { documentType: "ORGANIZATION_POLICIES", title: "Employee Handbook 2025", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "HIPAA Privacy Policy", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "Mandated Reporter Guidelines", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "Medication Administration Policy", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "Incident Reporting Procedures", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "Emergency Response Protocol", scope: "org" },
  { documentType: "ORGANIZATION_POLICIES", title: "Abuse Prevention Plan - Organization", scope: "org" },

  // House-level policies
  { documentType: "HOME_POLICIES", title: "House Rules and Expectations", scope: "house" },
  { documentType: "HOME_POLICIES", title: "Cleaning and Chore Schedule", scope: "house" },
  { documentType: "HOME_POLICIES", title: "Emergency Evacuation Plan", scope: "house" },
  { documentType: "HOME_POLICIES", title: "Visitor Policy", scope: "house" },
];

// Client-specific document types
const CLIENT_DOCUMENT_TYPES = [
  { documentType: "IAPP", title: "Individual Abuse Prevention Plan" },
  { documentType: "SUPPORT_PLAN_ADDENDUM", title: "Support Plan Addendum" },
  { documentType: "SELF_MANAGEMENT_ASSESSMENT", title: "Self-Management Assessment" },
];

async function seedDSPPortal() {
  console.log("🚀 Seeding DSP Portal data...\n");

  const results = {
    chores: 0,
    documents: 0,
    clientDocuments: 0,
  };

  // Get all houses
  const houses = await prisma.house.findMany();

  if (houses.length === 0) {
    console.log("❌ No houses found. Please run the main seed first.");
    return;
  }

  console.log(`📍 Found ${houses.length} houses`);

  // Get first admin user for uploadedById
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.log("❌ No admin user found. Please run the main seed first.");
    return;
  }

  console.log(`👤 Using admin user: ${adminUser.name}\n`);

  // Seed chores for each house
  console.log("📋 Seeding chores...");
  for (const house of houses) {
    let houseChores = 0;
    for (const choreData of SAMPLE_CHORES) {
      // Check if chore already exists
      const existing = await prisma.chore.findFirst({
        where: {
          houseId: house.id,
          name: choreData.name,
        },
      });

      if (!existing) {
        await prisma.chore.create({
          data: {
            houseId: house.id,
            name: choreData.name,
            description: choreData.description,
            category: choreData.category,
            shifts: JSON.stringify(choreData.shifts),
            isRequired: choreData.isRequired,
            requiresPhoto: (choreData as { requiresPhoto?: boolean }).requiresPhoto || false,
            createdById: adminUser.id,
          },
        });
        results.chores++;
        houseChores++;
      }
    }
    if (houseChores > 0) {
      console.log(`   ✓ ${house.name}: ${houseChores} chores created`);
    }
  }

  // Seed organization-wide documents
  console.log("\n📄 Seeding organization documents...");
  for (const docData of SAMPLE_DOCUMENTS.filter(d => d.scope === "org")) {
    const existing = await prisma.dSPDocument.findFirst({
      where: {
        title: docData.title,
        houseId: null,
        clientId: null,
      },
    });

    if (!existing) {
      await prisma.dSPDocument.create({
        data: {
          documentType: docData.documentType,
          title: docData.title,
          fileUrl: `/uploads/policies/${docData.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          requiresAcknowledgment: true,
          acknowledgmentDueDays: 7,
          uploadedById: adminUser.id,
        },
      });
      results.documents++;
      console.log(`   ✓ ${docData.title}`);
    }
  }

  // Seed house-level documents for each house
  console.log("\n🏠 Seeding house-level documents...");
  for (const house of houses) {
    let houseDocs = 0;
    for (const docData of SAMPLE_DOCUMENTS.filter(d => d.scope === "house")) {
      const existing = await prisma.dSPDocument.findFirst({
        where: {
          title: `${docData.title} - ${house.name}`,
          houseId: house.id,
        },
      });

      if (!existing) {
        await prisma.dSPDocument.create({
          data: {
            documentType: docData.documentType,
            title: `${docData.title} - ${house.name}`,
            houseId: house.id,
            fileUrl: `/uploads/policies/${house.name.toLowerCase().replace(/\s+/g, "-")}/${docData.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
            requiresAcknowledgment: true,
            acknowledgmentDueDays: 7,
            uploadedById: adminUser.id,
          },
        });
        results.documents++;
        houseDocs++;
      }
    }
    if (houseDocs > 0) {
      console.log(`   ✓ ${house.name}: ${houseDocs} documents created`);
    }
  }

  // Seed client-specific documents
  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    take: 20, // Limit to first 20 clients
  });

  console.log(`\n👥 Seeding client documents for ${clients.length} clients...`);
  for (const client of clients) {
    let clientDocs = 0;
    for (const docType of CLIENT_DOCUMENT_TYPES) {
      const existing = await prisma.dSPDocument.findFirst({
        where: {
          documentType: docType.documentType,
          clientId: client.id,
        },
      });

      if (!existing) {
        await prisma.dSPDocument.create({
          data: {
            documentType: docType.documentType,
            title: `${docType.title} - ${client.firstName} ${client.lastName}`,
            clientId: client.id,
            houseId: client.houseId,
            fileUrl: `/uploads/clients/${client.id}/${docType.documentType.toLowerCase()}.pdf`,
            requiresAcknowledgment: true,
            acknowledgmentDueDays: 7,
            uploadedById: adminUser.id,
          },
        });
        results.clientDocuments++;
        clientDocs++;
      }
    }
    if (clientDocs > 0) {
      console.log(`   ✓ ${client.firstName} ${client.lastName}: ${clientDocs} documents`);
    }
  }

  console.log("\n✅ DSP Portal seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Chores created:          ${results.chores}`);
  console.log(`   Org/House docs created:  ${results.documents}`);
  console.log(`   Client docs created:     ${results.clientDocuments}`);
  console.log(`   Houses processed:        ${houses.length}`);
  console.log(`   Clients processed:       ${clients.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

seedDSPPortal()
  .catch((e) => {
    console.error("Error seeding DSP Portal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
