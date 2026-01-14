import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

const ALLOWED_ROLES = ["ADMIN", "FINANCE"];

// GET - List period reconciliations
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const statusFilter = searchParams.get("status");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      where.houseId = houseFilter;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      where.periodStart = {
        gte: startDate,
        lte: endDate,
      };
    }

    const reconciliations = await prisma.periodReconciliation.findMany({
      where,
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
      orderBy: [{ periodStart: "desc" }],
    });

    // Get summary stats
    const allReconciliations = await prisma.periodReconciliation.findMany({
      where: { houseId: { in: houseIds } },
    });

    const stats = {
      totalBilled: allReconciliations.reduce((sum, r) => sum + Number(r.billedAmount), 0),
      totalPaid: allReconciliations.reduce((sum, r) => sum + Number(r.paidAmount), 0),
      totalPending: allReconciliations.reduce((sum, r) => sum + Number(r.pendingAmount), 0),
      countPending: allReconciliations.filter((r) => r.status === "PENDING").length,
      countPartial: allReconciliations.filter((r) => r.status === "PARTIAL").length,
      countPaid: allReconciliations.filter((r) => r.status === "PAID").length,
    };

    return NextResponse.json({ reconciliations, stats });
  } catch (error) {
    console.error("Error fetching reconciliations:", error);
    return NextResponse.json({ error: "Failed to fetch reconciliations" }, { status: 500 });
  }
}

// POST - Create period reconciliation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();
    const {
      houseId,
      periodStart,
      periodEnd,
      billedAmount,
      billedUnits,
      paidAmount,
      paymentReceiptId,
      serviceType,
      notes,
    } = data;

    if (!houseId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "houseId, periodStart, and periodEnd are required" },
        { status: 400 }
      );
    }

    // Verify house access
    const houseIds = await getUserHouseIds(session.id);
    if (!houseIds.includes(houseId)) {
      return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
    }

    const billed = parseFloat(billedAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const pending = billed - paid;

    // Determine status
    let status = "PENDING";
    if (paid >= billed && billed > 0) {
      status = "PAID";
    } else if (paid > 0 && paid < billed) {
      status = "PARTIAL";
    }

    const reconciliation = await prisma.periodReconciliation.create({
      data: {
        houseId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        billedAmount: billed,
        billedUnits: parseInt(billedUnits) || 0,
        paidAmount: paid,
        pendingAmount: pending > 0 ? pending : 0,
        paymentReceiptId: paymentReceiptId || null,
        serviceType: serviceType || "CRS",
        status,
        notes: notes || null,
        createdById: session.id,
      },
      include: {
        house: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "PERIOD_RECONCILIATION",
        entityId: reconciliation.id,
        details: JSON.stringify({
          houseId,
          periodStart,
          periodEnd,
          billedAmount: billed,
          paidAmount: paid,
        }),
      },
    });

    return NextResponse.json({ reconciliation });
  } catch (error) {
    console.error("Error creating reconciliation:", error);
    return NextResponse.json({ error: "Failed to create reconciliation" }, { status: 500 });
  }
}
