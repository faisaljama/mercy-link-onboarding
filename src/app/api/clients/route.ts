import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { addDays } from "date-fns";

// 245D Compliance items to auto-generate for new clients
const CLIENT_COMPLIANCE_ITEMS = [
  { itemType: "ABUSE_PREVENTION_PLAN", itemName: "Abuse Prevention Plan", daysFromAdmission: 0, statuteRef: "245D.071, Subd. 2" },
  { itemType: "SERVICE_RECIPIENT_RIGHTS", itemName: "Service Recipient Rights Review", daysFromAdmission: 0, statuteRef: "245D.04" },
  { itemType: "PRELIMINARY_CSSP", itemName: "Preliminary CSSP Addendum", daysFromAdmission: 15, statuteRef: "245D.071, Subd. 3(a)" },
  { itemType: "FUNCTIONAL_ASSESSMENT", itemName: "Functional Assessment", daysFromAdmission: 60, statuteRef: "245D.071, Subd. 3(b)" },
  { itemType: "PLANNING_MEETING_45_DAY", itemName: "45/60-Day Planning Meeting", daysFromAdmission: 60, statuteRef: "245D.071, Subd. 3(c)" },
  { itemType: "SERVICE_PLAN_CSSP", itemName: "Service Plan (CSSP Addendum)", daysFromAdmission: 74, statuteRef: "245D.071, Subd. 4(a)" },
  { itemType: "CSSP_SIGNATURES", itemName: "CSSP Addendum Signatures", daysFromAdmission: 88, statuteRef: "245D.071, Subd. 4(c)" },
  { itemType: "PROGRESS_REVIEW", itemName: "Q1 Progress Review", daysFromAdmission: 90, statuteRef: "245D.071, Subd. 5" },
  { itemType: "PROGRESS_REVIEW", itemName: "Q2 Progress Review", daysFromAdmission: 180, statuteRef: "245D.071, Subd. 5" },
  { itemType: "PROGRESS_REVIEW", itemName: "Q3 Progress Review", daysFromAdmission: 270, statuteRef: "245D.071, Subd. 5" },
  { itemType: "ANNUAL_PLANNING_MEETING", itemName: "Annual Planning Meeting", daysFromAdmission: 365, statuteRef: "245D.071, Subd. 3" },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      firstName,
      lastName,
      dob,
      admissionDate,
      houseId,
      waiverType,
      photoUrl,
      mhCaseManagerName,
      mhCaseManagerEmail,
      mhCaseManagerPhone,
      cadiCaseManagerName,
      cadiCaseManagerEmail,
      cadiCaseManagerPhone,
      legalRepName,
      legalRepPhone,
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !dob || !admissionDate || !houseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const houseIds = await getUserHouseIds(session.id);
    if (!houseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    const admission = new Date(admissionDate);

    // Create client with compliance items in a transaction
    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          firstName,
          lastName,
          dob: new Date(dob),
          admissionDate: admission,
          houseId,
          waiverType: waiverType || null,
          photoUrl: photoUrl || null,
          mhCaseManagerName: mhCaseManagerName || null,
          mhCaseManagerEmail: mhCaseManagerEmail || null,
          mhCaseManagerPhone: mhCaseManagerPhone || null,
          cadiCaseManagerName: cadiCaseManagerName || null,
          cadiCaseManagerEmail: cadiCaseManagerEmail || null,
          cadiCaseManagerPhone: cadiCaseManagerPhone || null,
          legalRepName: legalRepName || null,
          legalRepPhone: legalRepPhone || null,
        },
      });

      // Auto-generate compliance items
      await tx.complianceItem.createMany({
        data: CLIENT_COMPLIANCE_ITEMS.map((item) => ({
          entityType: "CLIENT",
          itemType: item.itemType,
          itemName: item.itemName,
          dueDate: addDays(admission, item.daysFromAdmission),
          status: "PENDING",
          statuteRef: item.statuteRef,
          clientId: newClient.id,
        })),
      });

      return newClient;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        details: JSON.stringify({
          firstName,
          lastName,
          houseId,
          admissionDate,
        }),
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("house");

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
      status: "ACTIVE",
    };

    if (houseFilter && houseFilter !== "all") {
      whereClause.houseId = houseFilter;
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        house: true,
        _count: {
          select: {
            complianceItems: {
              where: { status: "OVERDUE" },
            },
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
