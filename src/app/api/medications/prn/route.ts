import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { put } from "@vercel/blob";

const LOW_STOCK_THRESHOLD = 12;

// GET - List PRN inventory
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can access
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const searchParams = request.nextUrl.searchParams;

    const houseId = searchParams.get("houseId");
    const clientId = searchParams.get("clientId");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const where: Record<string, unknown> = {
      houseId: houseId && houseIds.includes(houseId) ? houseId : { in: houseIds },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (lowStockOnly) {
      where.quantityRemaining = { lte: LOW_STOCK_THRESHOLD };
    }

    const inventory = await prisma.prnInventory.findMany({
      where,
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
      },
      orderBy: [
        { quantityRemaining: "asc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ inventory, lowStockThreshold: LOW_STOCK_THRESHOLD });
  } catch (error) {
    console.error("Error fetching PRN inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST - Create new PRN inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can create
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const clientId = formData.get("clientId") as string;
    const medicationName = formData.get("medicationName") as string;
    const quantityRemaining = parseInt(formData.get("quantityRemaining") as string);
    const expirationDate = formData.get("expirationDate") as string;
    const notes = formData.get("notes") as string | null;
    const photo = formData.get("photo") as File | null;

    if (!clientId || !medicationName || isNaN(quantityRemaining) || !expirationDate) {
      return NextResponse.json(
        { error: "Client, medication name, quantity, and expiration date are required" },
        { status: 400 }
      );
    }

    if (medicationName.trim().length < 2) {
      return NextResponse.json(
        { error: "Medication name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (quantityRemaining < 0) {
      return NextResponse.json(
        { error: "Quantity must be 0 or greater" },
        { status: 400 }
      );
    }

    // Verify user has access to client's house
    const houseIds = await getUserHouseIds(session.id);
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { houseId: true },
    });

    if (!client || !houseIds.includes(client.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let photoUrl: string | null = null;

    // Upload photo if provided
    if (photo) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = photo.name.split(".").pop() || "jpg";
      const filename = `medications/prn/${timestamp}-${randomString}.${extension}`;

      const blob = await put(filename, photo, {
        access: "public",
        addRandomSuffix: false,
      });
      photoUrl = blob.url;
    }

    // Create PRN inventory record
    const prnItem = await prisma.prnInventory.create({
      data: {
        clientId,
        houseId: client.houseId,
        medicationName: medicationName.trim(),
        quantityRemaining,
        expirationDate: new Date(expirationDate),
        photoUrl,
        notes: notes || null,
        updatedById: session.id,
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
      },
    });

    // Create history record
    await prisma.prnHistory.create({
      data: {
        prnInventoryId: prnItem.id,
        quantityRemaining,
        updatedById: session.id,
      },
    });

    // If low stock, create alert log
    const isLowStock = quantityRemaining <= LOW_STOCK_THRESHOLD;
    let alertLog = null;

    if (isLowStock) {
      alertLog = await prisma.prnAlertLog.create({
        data: {
          prnInventoryId: prnItem.id,
          alertType: "popup",
          quantityAtAlert: quantityRemaining,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "PRN_INVENTORY",
        entityId: prnItem.id,
        details: JSON.stringify({
          clientId,
          medicationName,
          quantityRemaining,
          expirationDate,
          isLowStock,
        }),
      },
    });

    return NextResponse.json({
      prnItem,
      isLowStock,
      alertLog,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error) {
    console.error("Error creating PRN inventory:", error);
    return NextResponse.json(
      { error: "Failed to create PRN inventory" },
      { status: 500 }
    );
  }
}
