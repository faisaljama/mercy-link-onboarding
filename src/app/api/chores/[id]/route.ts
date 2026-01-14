import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get single chore
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

    const chore = await prisma.chore.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Error fetching chore:", error);
    return NextResponse.json(
      { error: "Failed to fetch chore" },
      { status: 500 }
    );
  }
}

// PUT - Update chore
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const {
      name,
      description,
      category,
      shifts,
      requiresPhoto,
      isRequired,
      sortOrder,
      isActive,
    } = data;

    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.chore.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category) updateData.category = category;
    if (shifts) updateData.shifts = JSON.stringify(shifts);
    if (typeof requiresPhoto === "boolean") updateData.requiresPhoto = requiresPhoto;
    if (typeof isRequired === "boolean") updateData.isRequired = isRequired;
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const chore = await prisma.chore.update({
      where: { id },
      data: updateData,
      include: {
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
        action: "UPDATE",
        entityType: "CHORE",
        entityId: id,
        details: JSON.stringify({
          changes: updateData,
          choreName: chore.name,
        }),
      },
    });

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Error updating chore:", error);
    return NextResponse.json(
      { error: "Failed to update chore" },
      { status: 500 }
    );
  }
}

// DELETE - Delete chore
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.chore.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await prisma.chore.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CHORE",
        entityId: id,
        details: JSON.stringify({
          choreName: existing.name,
          houseId: existing.houseId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chore:", error);
    return NextResponse.json(
      { error: "Failed to delete chore" },
      { status: 500 }
    );
  }
}
