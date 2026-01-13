import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { put } from "@vercel/blob";

const LOW_STOCK_THRESHOLD = 12;

// GET - Get single PRN inventory item
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

    const prnItem = await prisma.prnInventory.findUnique({
      where: { id },
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
        history: {
          include: {
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!prnItem) {
      return NextResponse.json({ error: "PRN item not found" }, { status: 404 });
    }

    if (!houseIds.includes(prnItem.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ prnItem, lowStockThreshold: LOW_STOCK_THRESHOLD });
  } catch (error) {
    console.error("Error fetching PRN item:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRN item" },
      { status: 500 }
    );
  }
}

// PUT - Update PRN inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can update
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if PRN item exists and user has access
    const existing = await prisma.prnInventory.findUnique({
      where: { id },
      select: { houseId: true, quantityRemaining: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "PRN item not found" }, { status: 404 });
    }

    if (!houseIds.includes(existing.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const medicationName = formData.get("medicationName") as string | null;
    const quantityRemaining = formData.get("quantityRemaining")
      ? parseInt(formData.get("quantityRemaining") as string)
      : null;
    const expirationDate = formData.get("expirationDate") as string | null;
    const notes = formData.get("notes") as string | null;
    const photo = formData.get("photo") as File | null;

    const updateData: Record<string, unknown> = {
      updatedById: session.id,
    };

    if (medicationName !== null && medicationName.trim().length >= 2) {
      updateData.medicationName = medicationName.trim();
    }

    if (quantityRemaining !== null && !isNaN(quantityRemaining) && quantityRemaining >= 0) {
      updateData.quantityRemaining = quantityRemaining;
    }

    if (expirationDate !== null) {
      updateData.expirationDate = new Date(expirationDate);
    }

    if (notes !== null) {
      updateData.notes = notes || null;
    }

    // Upload new photo if provided
    if (photo) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = photo.name.split(".").pop() || "jpg";
      const filename = `medications/prn/${timestamp}-${randomString}.${extension}`;

      const blob = await put(filename, photo, {
        access: "public",
        addRandomSuffix: false,
      });
      updateData.photoUrl = blob.url;
    }

    // Update PRN item
    const prnItem = await prisma.prnInventory.update({
      where: { id },
      data: updateData,
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

    // Create history record if quantity changed
    if (quantityRemaining !== null && quantityRemaining !== existing.quantityRemaining) {
      await prisma.prnHistory.create({
        data: {
          prnInventoryId: prnItem.id,
          quantityRemaining,
          updatedById: session.id,
        },
      });
    }

    // Check for low stock alert
    const isLowStock = prnItem.quantityRemaining <= LOW_STOCK_THRESHOLD;
    const wasLowStock = existing.quantityRemaining <= LOW_STOCK_THRESHOLD;
    let alertLog = null;

    // Only create alert if it's newly low stock (wasn't low before, now is)
    if (isLowStock && !wasLowStock) {
      alertLog = await prisma.prnAlertLog.create({
        data: {
          prnInventoryId: prnItem.id,
          alertType: "popup",
          quantityAtAlert: prnItem.quantityRemaining,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "PRN_INVENTORY",
        entityId: prnItem.id,
        details: JSON.stringify({
          previousQuantity: existing.quantityRemaining,
          newQuantity: prnItem.quantityRemaining,
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
    console.error("Error updating PRN item:", error);
    return NextResponse.json(
      { error: "Failed to update PRN item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete PRN inventory item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.prnInventory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "PRN item not found" }, { status: 404 });
    }

    await prisma.prnInventory.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "PRN_INVENTORY",
        entityId: id,
        details: JSON.stringify({
          medicationName: existing.medicationName,
          clientId: existing.clientId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting PRN item:", error);
    return NextResponse.json(
      { error: "Failed to delete PRN item" },
      { status: 500 }
    );
  }
}
