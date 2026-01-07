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

    const expenses = await prisma.houseExpense.findMany({
      where: whereClause,
      include: {
        house: { select: { id: true, name: true } },
        purchasedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }],
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
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
      houseId,
      date,
      amount,
      category,
      vendor,
      description,
      receiptUrl,
      purchasedById,
      participants,
    } = data;

    // Validate required fields
    if (!houseId || !date || !amount || !category || !purchasedById) {
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

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expense = await prisma.houseExpense.create({
      data: {
        houseId,
        date: expenseDate,
        amount,
        category,
        vendor: vendor || null,
        description: description || null,
        receiptUrl: receiptUrl || null,
        purchasedById,
        participants: participants ? JSON.stringify(participants) : null,
        createdById: session.id,
        month,
        year,
      },
      include: {
        house: { select: { name: true } },
        purchasedBy: { select: { name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "HOUSE_EXPENSE",
        entityId: expense.id,
        details: JSON.stringify({
          houseId,
          amount,
          category,
          vendor,
        }),
      },
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
