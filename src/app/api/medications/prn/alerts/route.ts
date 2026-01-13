import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

const LOW_STOCK_THRESHOLD = 12;

// GET - Get all low stock PRN alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);

    // Get all PRN items with low stock
    const lowStockItems = await prisma.prnInventory.findMany({
      where: {
        houseId: { in: houseIds },
        quantityRemaining: { lte: LOW_STOCK_THRESHOLD },
      },
      include: {
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
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        alertLogs: {
          where: {
            acknowledgedAt: { not: null },
          },
          orderBy: { acknowledgedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { quantityRemaining: "asc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({
      alerts: lowStockItems,
      count: lowStockItems.length,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      genoaPharmacyPhone: "651-583-7097",
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// POST - Acknowledge an alert
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can acknowledge
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { prnInventoryId, acknowledgmentType, acknowledgmentNotes, alertType } = body;

    if (!prnInventoryId || !acknowledgmentType) {
      return NextResponse.json(
        { error: "PRN inventory ID and acknowledgment type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["called", "closed", "on_order", "other"];
    if (!validTypes.includes(acknowledgmentType)) {
      return NextResponse.json(
        { error: "Invalid acknowledgment type" },
        { status: 400 }
      );
    }

    if (acknowledgmentType === "other" && (!acknowledgmentNotes || !acknowledgmentNotes.trim())) {
      return NextResponse.json(
        { error: "Notes are required when acknowledgment type is 'other'" },
        { status: 400 }
      );
    }

    // Verify user has access to the PRN item
    const houseIds = await getUserHouseIds(session.id);
    const prnItem = await prisma.prnInventory.findUnique({
      where: { id: prnInventoryId },
      select: { houseId: true, quantityRemaining: true },
    });

    if (!prnItem) {
      return NextResponse.json({ error: "PRN item not found" }, { status: 404 });
    }

    if (!houseIds.includes(prnItem.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create alert log with acknowledgment
    const alertLog = await prisma.prnAlertLog.create({
      data: {
        prnInventoryId,
        alertType: alertType || "popup",
        quantityAtAlert: prnItem.quantityRemaining,
        acknowledgmentType,
        acknowledgmentNotes: acknowledgmentNotes || null,
        acknowledgedById: session.id,
        acknowledgedAt: new Date(),
      },
      include: {
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ alertLog });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}
