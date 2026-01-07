import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function PUT(
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

    const existing = await prisma.houseExpense.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const data = await request.json();

    const expense = await prisma.houseExpense.update({
      where: { id },
      data: {
        amount: data.amount !== undefined ? data.amount : existing.amount,
        category: data.category || existing.category,
        vendor: data.vendor !== undefined ? data.vendor : existing.vendor,
        description: data.description !== undefined ? data.description : existing.description,
        receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : existing.receiptUrl,
        participants: data.participants !== undefined
          ? JSON.stringify(data.participants)
          : existing.participants,
      },
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
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

    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.houseExpense.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.houseExpense.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "HOUSE_EXPENSE",
        entityId: id,
        details: JSON.stringify({
          amount: existing.amount,
          category: existing.category,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
