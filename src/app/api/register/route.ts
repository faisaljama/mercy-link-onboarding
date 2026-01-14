import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);

    const entries = await prisma.admissionDischarge.findMany({
      where: {
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching register entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch register entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can create entries
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const houseIds = await getUserHouseIds(session.id);
    const data = await request.json();
    const {
      clientId,
      type,
      date,
      fromLocation,
      toLocation,
      reason,
      dischargeType,
      notes,
    } = data;

    // Validate required fields
    if (!clientId || !type || !date) {
      return NextResponse.json(
        { error: "Client, type, and date are required" },
        { status: 400 }
      );
    }

    // Verify client exists and user has access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: houseIds },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Validate type
    const validTypes = ["ADMISSION", "DISCHARGE", "TRANSFER_IN", "TRANSFER_OUT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Create entry
    const entry = await prisma.admissionDischarge.create({
      data: {
        clientId,
        type,
        date: new Date(date),
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
        reason: reason || null,
        dischargeType: dischargeType || null,
        notes: notes || null,
      },
      include: {
        client: {
          include: {
            house: true,
          },
        },
      },
    });

    // If discharge, update client status
    if (type === "DISCHARGE") {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "DISCHARGED" },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "ADMISSION_DISCHARGE",
        entityId: entry.id,
        details: JSON.stringify({
          type,
          clientName: `${client.firstName} ${client.lastName}`,
          date,
        }),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating register entry:", error);
    return NextResponse.json(
      { error: "Failed to create register entry" },
      { status: 500 }
    );
  }
}
