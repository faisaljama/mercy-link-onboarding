import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get single staff-resident assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const assignment = await prisma.staffResidentAssignment.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
            phone: true,
            hireDate: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            admissionDate: true,
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
        onboardingAcknowledgments: {
          include: {
            document: {
              select: {
                id: true,
                documentType: true,
                title: true,
                version: true,
              },
            },
          },
          orderBy: { acknowledgedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching staff assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff assignment" },
      { status: 500 }
    );
  }
}

// PUT - Update staff-resident assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const { isActive, onboardingComplete } = data;

    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.staffResidentAssignment.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (typeof onboardingComplete === "boolean") {
      updateData.onboardingComplete = onboardingComplete;
      if (onboardingComplete && !existing.onboardingCompletedAt) {
        updateData.onboardingCompletedAt = new Date();
      }
    }

    const assignment = await prisma.staffResidentAssignment.update({
      where: { id },
      data: updateData,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "STAFF_RESIDENT_ASSIGNMENT",
        entityId: id,
        details: JSON.stringify({
          changes: updateData,
          staffName: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
          clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
        }),
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error updating staff assignment:", error);
    return NextResponse.json(
      { error: "Failed to update staff assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate staff-resident assignment (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.staffResidentAssignment.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        staff: {
          select: { firstName: true, lastName: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    await prisma.staffResidentAssignment.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "STAFF_RESIDENT_ASSIGNMENT",
        entityId: id,
        details: JSON.stringify({
          staffName: `${existing.staff.firstName} ${existing.staff.lastName}`,
          clientName: `${existing.client.firstName} ${existing.client.lastName}`,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete staff assignment" },
      { status: 500 }
    );
  }
}
