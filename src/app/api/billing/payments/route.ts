import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

const ALLOWED_ROLES = ["ADMIN", "FINANCE"];

// GET - List payment receipts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};

    // Filter by house (optional - payments can be global or house-specific)
    if (houseFilter && houseIds.includes(houseFilter)) {
      where.houseId = houseFilter;
    } else {
      where.OR = [
        { houseId: { in: houseIds } },
        { houseId: null }, // Include global payments
      ];
    }

    // Filter by date range if year/month provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.paymentDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      where.paymentDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const payments = await prisma.paymentReceipt.findMany({
      where,
      include: {
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Create payment receipt
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
      paymentNumber,
      paymentType,
      paymentDate,
      paidCustomizedLiving,
      paidPCA,
      paidICS,
      paidOther,
      houseId,
      notes,
    } = data;

    if (!paymentType || !paymentDate) {
      return NextResponse.json(
        { error: "paymentType and paymentDate are required" },
        { status: 400 }
      );
    }

    // Verify house access if provided
    if (houseId) {
      const houseIds = await getUserHouseIds(session.id);
      if (!houseIds.includes(houseId)) {
        return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
      }
    }

    // Calculate total
    const total =
      (parseFloat(paidCustomizedLiving) || 0) +
      (parseFloat(paidPCA) || 0) +
      (parseFloat(paidICS) || 0) +
      (parseFloat(paidOther) || 0);

    const payment = await prisma.paymentReceipt.create({
      data: {
        paymentNumber: paymentNumber || null,
        paymentType,
        paymentDate: new Date(paymentDate),
        paidCustomizedLiving: parseFloat(paidCustomizedLiving) || 0,
        paidPCA: parseFloat(paidPCA) || 0,
        paidICS: parseFloat(paidICS) || 0,
        paidOther: parseFloat(paidOther) || 0,
        totalAmount: total,
        houseId: houseId || null,
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
        entityType: "PAYMENT_RECEIPT",
        entityId: payment.id,
        details: JSON.stringify({
          paymentNumber,
          paymentType,
          totalAmount: total,
          houseId,
        }),
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
