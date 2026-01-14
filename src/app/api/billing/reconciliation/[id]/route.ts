import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

const ALLOWED_ROLES = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "FINANCE"];

// GET - Get single reconciliation
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

    const reconciliation = await prisma.periodReconciliation.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        house: {
          select: { id: true, name: true },
        },
        paymentReceipt: {
          select: {
            id: true,
            paymentNumber: true,
            paymentDate: true,
            totalAmount: true,
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!reconciliation) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    return NextResponse.json({ reconciliation });
  } catch (error) {
    console.error("Error fetching reconciliation:", error);
    return NextResponse.json({ error: "Failed to fetch reconciliation" }, { status: 500 });
  }
}

// PUT - Update reconciliation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.periodReconciliation.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      billedAmount,
      billedUnits,
      paidAmount,
      paymentReceiptId,
      status,
      notes,
    } = data;

    const updateData: Record<string, unknown> = {};

    if (billedAmount !== undefined) {
      updateData.billedAmount = parseFloat(billedAmount) || 0;
    }
    if (billedUnits !== undefined) {
      updateData.billedUnits = parseInt(billedUnits) || 0;
    }
    if (paidAmount !== undefined) {
      updateData.paidAmount = parseFloat(paidAmount) || 0;
    }
    if (paymentReceiptId !== undefined) {
      updateData.paymentReceiptId = paymentReceiptId || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Recalculate pending amount and status
    const billed = updateData.billedAmount !== undefined
      ? updateData.billedAmount as number
      : Number(existing.billedAmount);
    const paid = updateData.paidAmount !== undefined
      ? updateData.paidAmount as number
      : Number(existing.paidAmount);

    updateData.pendingAmount = Math.max(0, billed - paid);

    // Auto-update status if not explicitly provided
    if (status !== undefined) {
      updateData.status = status;
    } else {
      if (paid >= billed && billed > 0) {
        updateData.status = "PAID";
      } else if (paid > 0 && paid < billed) {
        updateData.status = "PARTIAL";
      } else {
        updateData.status = "PENDING";
      }
    }

    const reconciliation = await prisma.periodReconciliation.update({
      where: { id },
      data: updateData,
      include: {
        house: {
          select: { id: true, name: true },
        },
        paymentReceipt: {
          select: {
            id: true,
            paymentNumber: true,
            paymentDate: true,
            totalAmount: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "PERIOD_RECONCILIATION",
        entityId: id,
        details: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ reconciliation });
  } catch (error) {
    console.error("Error updating reconciliation:", error);
    return NextResponse.json({ error: "Failed to update reconciliation" }, { status: 500 });
  }
}

// DELETE - Delete reconciliation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.periodReconciliation.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    await prisma.periodReconciliation.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "PERIOD_RECONCILIATION",
        entityId: id,
        details: JSON.stringify({
          houseId: existing.houseId,
          periodStart: existing.periodStart,
          periodEnd: existing.periodEnd,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reconciliation:", error);
    return NextResponse.json({ error: "Failed to delete reconciliation" }, { status: 500 });
  }
}
