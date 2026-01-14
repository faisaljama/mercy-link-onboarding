import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

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

    const entry = await prisma.admissionDischarge.findFirst({
      where: {
        id,
        client: {
          houseId: { in: houseIds },
        },
      },
      include: {
        client: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching register entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch register entry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can edit entries
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify entry exists and user has access
    const existingEntry = await prisma.admissionDischarge.findFirst({
      where: {
        id,
        client: {
          houseId: { in: houseIds },
        },
      },
      include: {
        client: true,
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      type,
      date,
      fromLocation,
      toLocation,
      reason,
      dischargeType,
      notes,
    } = data;

    // Validate type if provided
    if (type) {
      const validTypes = ["ADMISSION", "DISCHARGE", "TRANSFER_IN", "TRANSFER_OUT"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
    }

    const entry = await prisma.admissionDischarge.update({
      where: { id },
      data: {
        type: type || existingEntry.type,
        date: date ? new Date(date) : existingEntry.date,
        fromLocation: fromLocation !== undefined ? fromLocation || null : existingEntry.fromLocation,
        toLocation: toLocation !== undefined ? toLocation || null : existingEntry.toLocation,
        reason: reason !== undefined ? reason || null : existingEntry.reason,
        dischargeType: dischargeType !== undefined ? dischargeType || null : existingEntry.dischargeType,
        notes: notes !== undefined ? notes || null : existingEntry.notes,
      },
      include: {
        client: {
          include: {
            house: true,
          },
        },
      },
    });

    // Handle client status changes based on type
    const newType = type || existingEntry.type;
    const oldType = existingEntry.type;

    // If changing from discharge to non-discharge, reactivate client
    if (oldType === "DISCHARGE" && newType !== "DISCHARGE") {
      await prisma.client.update({
        where: { id: existingEntry.clientId },
        data: { status: "ACTIVE" },
      });
    }
    // If changing to discharge from non-discharge, deactivate client
    else if (oldType !== "DISCHARGE" && newType === "DISCHARGE") {
      await prisma.client.update({
        where: { id: existingEntry.clientId },
        data: { status: "DISCHARGED" },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "ADMISSION_DISCHARGE",
        entityId: id,
        details: JSON.stringify({
          clientName: `${existingEntry.client.firstName} ${existingEntry.client.lastName}`,
          previousType: oldType,
          newType,
          date,
        }),
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error updating register entry:", error);
    return NextResponse.json(
      { error: "Failed to update register entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete entries
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete entries" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify entry exists and user has access
    const existingEntry = await prisma.admissionDischarge.findFirst({
      where: {
        id,
        client: {
          houseId: { in: houseIds },
        },
      },
      include: {
        client: true,
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.admissionDischarge.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "ADMISSION_DISCHARGE",
        entityId: id,
        details: JSON.stringify({
          clientName: `${existingEntry.client.firstName} ${existingEntry.client.lastName}`,
          type: existingEntry.type,
          date: existingEntry.date,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting register entry:", error);
    return NextResponse.json(
      { error: "Failed to delete register entry" },
      { status: 500 }
    );
  }
}
