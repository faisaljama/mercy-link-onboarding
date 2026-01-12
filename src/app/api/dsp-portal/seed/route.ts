import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

// Client-specific document types (will be created per client)
const CLIENT_DOCUMENT_TYPES = [
  { documentType: "IAPP", title: "Individual Abuse Prevention Plan" },
  { documentType: "SUPPORT_PLAN_ADDENDUM", title: "Support Plan Addendum" },
  { documentType: "SELF_MANAGEMENT_ASSESSMENT", title: "Self-Management Assessment" },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const results = {
      chores: 0,
      documents: 0,
      clientDocuments: 0,
    };

    // Get all houses
    const houses = await prisma.house.findMany();

    if (houses.length === 0) {
      return NextResponse.json({ error: "No houses found. Please seed houses first." }, { status: 400 });
    }

    // Get first admin user for uploadedById
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "No admin user found" }, { status: 400 });
    }

    // Seed chores for each house
    for (const house of houses) {
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
              requiresPhoto: choreData.requiresPhoto || false,
              createdById: adminUser.id,
            },
          });
          results.chores++;
        }
      }
    }

    // Seed organization-wide documents
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
      }
    }

    // Seed house-level documents for each house
    for (const house of houses) {
      for (const docData of SAMPLE_DOCUMENTS.filter(d => d.scope === "house")) {
        const existing = await prisma.dSPDocument.findFirst({
          where: {
            title: docData.title,
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
        }
      }
    }

    // Seed client-specific documents
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      take: 20, // Limit to first 20 clients
    });

    for (const client of clients) {
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
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "DSP Portal data seeded successfully",
      results: {
        choresCreated: results.chores,
        documentsCreated: results.documents,
        clientDocumentsCreated: results.clientDocuments,
        housesProcessed: houses.length,
        clientsProcessed: clients.length,
      },
    });
  } catch (error) {
    console.error("Error seeding DSP Portal data:", error);
    return NextResponse.json(
      { error: "Failed to seed DSP Portal data" },
      { status: 500 }
    );
  }
}

// GET endpoint to check current seed status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [choresCount, documentsCount, housesCount, clientsCount] = await Promise.all([
      prisma.chore.count(),
      prisma.dSPDocument.count(),
      prisma.house.count(),
      prisma.client.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      currentData: {
        chores: choresCount,
        documents: documentsCount,
        houses: housesCount,
        activeClients: clientsCount,
      },
    });
  } catch (error) {
    console.error("Error checking seed status:", error);
    return NextResponse.json(
      { error: "Failed to check seed status" },
      { status: 500 }
    );
  }
}
