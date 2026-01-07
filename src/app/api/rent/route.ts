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
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("house");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseFilter !== "all") {
      whereClause.houseId = houseFilter;
    }

    if (month) {
      whereClause.month = parseInt(month);
    }

    if (year) {
      whereClause.year = parseInt(year);
    }

    const rentPayments = await prisma.rentPayment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rentAmount: true,
            checkDeliveryLocation: true,
          },
        },
        house: {
          select: { id: true, name: true },
        },
        enteredBy: {
          select: { id: true, name: true },
        },
        signedOffBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { client: { lastName: "asc" } }],
    });

    return NextResponse.json({ rentPayments });
  } catch (error) {
    console.error("Error fetching rent payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch rent payments" },
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

    const data = await request.json();
    const {
      clientId,
      houseId,
      month,
      year,
      amountDue,
      amountPaid,
      paymentDate,
      paymentMethod,
      checkNumber,
      notes,
    } = data;

    // Validate required fields
    if (!clientId || !houseId || !month || !year || amountDue === undefined || amountPaid === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const houseIds = await getUserHouseIds(session.id);
    if (!houseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Check if payment already exists for this client/month/year
    const existing = await prisma.rentPayment.findFirst({
      where: { clientId, month, year },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Rent payment already exists for this month. Use update instead." },
        { status: 400 }
      );
    }

    const rentPayment = await prisma.rentPayment.create({
      data: {
        clientId,
        houseId,
        month,
        year,
        amountDue,
        amountPaid,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod: paymentMethod || null,
        checkNumber: checkNumber || null,
        notes: notes || null,
        enteredById: session.id,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        enteredBy: {
          select: { name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "RENT_PAYMENT",
        entityId: rentPayment.id,
        details: JSON.stringify({
          clientId,
          month,
          year,
          amountPaid,
        }),
      },
    });

    return NextResponse.json({ rentPayment });
  } catch (error) {
    console.error("Error creating rent payment:", error);
    return NextResponse.json(
      { error: "Failed to create rent payment" },
      { status: 500 }
    );
  }
}
