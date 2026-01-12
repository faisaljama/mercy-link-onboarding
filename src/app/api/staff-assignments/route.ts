import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - List staff-resident assignments for user's accessible houses
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const staffFilter = searchParams.get("staffId");
    const clientFilter = searchParams.get("clientId");
    const activeOnly = searchParams.get("active") !== "false";

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      whereClause.houseId = houseFilter;
    }

    if (staffFilter) {
      whereClause.staffId = staffFilter;
    }

    if (clientFilter) {
      whereClause.clientId = clientFilter;
    }

    if (activeOnly) {
      whereClause.isActive = true;
    }

    const assignments = await prisma.staffResidentAssignment.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            status: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            onboardingAcknowledgments: true,
          },
        },
      },
      orderBy: [{ house: { name: "asc" } }, { staff: { lastName: "asc" } }],
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching staff assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff assignments" },
      { status: 500 }
    );
  }
}

// POST - Create new staff-resident assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only certain roles can create assignments
    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();
    const { staffId, clientId, houseId } = data;

    if (!staffId || !clientId || !houseId) {
      return NextResponse.json(
        { error: "staffId, clientId, and houseId are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const userHouseIds = await getUserHouseIds(session.id);
    if (!userHouseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Verify the staff member is assigned to this house
    const staffHouseAssignment = await prisma.employeeHouse.findFirst({
      where: {
        employeeId: staffId,
        houseId,
      },
    });

    if (!staffHouseAssignment) {
      return NextResponse.json(
        { error: "Staff member is not assigned to this house" },
        { status: 400 }
      );
    }

    // Verify the client is at this house
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId,
        status: "ACTIVE",
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found at this house" },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.staffResidentAssignment.findUnique({
      where: {
        staffId_clientId: {
          staffId,
          clientId,
        },
      },
    });

    if (existingAssignment) {
      // If inactive, reactivate it
      if (!existingAssignment.isActive) {
        const reactivated = await prisma.staffResidentAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            onboardingComplete: false,
            onboardingCompletedAt: null,
          },
          include: {
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        return NextResponse.json({ assignment: reactivated });
      }
      return NextResponse.json(
        { error: "Assignment already exists" },
        { status: 400 }
      );
    }

    const assignment = await prisma.staffResidentAssignment.create({
      data: {
        staffId,
        clientId,
        houseId,
        assignedById: session.id,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "STAFF_RESIDENT_ASSIGNMENT",
        entityId: assignment.id,
        details: JSON.stringify({
          staffId,
          clientId,
          houseId,
          staffName: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
          clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
        }),
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error creating staff assignment:", error);
    return NextResponse.json(
      { error: "Failed to create staff assignment" },
      { status: 500 }
    );
  }
}
