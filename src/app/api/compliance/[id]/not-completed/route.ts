import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { correctiveAction, correctiveNotes, correctionDueDate } = body;

    if (!correctiveAction) {
      return NextResponse.json(
        { error: "Corrective action is required" },
        { status: 400 }
      );
    }

    const item = await prisma.complianceItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updatedItem = await prisma.complianceItem.update({
      where: { id },
      data: {
        status: "NOT_COMPLETED",
        correctiveAction,
        correctiveNotes: correctiveNotes || null,
        correctionDueDate: correctionDueDate ? new Date(correctionDueDate) : null,
        correctionCompleted: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "STATUS_CHANGE",
        entityType: "COMPLIANCE_ITEM",
        entityId: id,
        details: JSON.stringify({
          itemName: item.itemName,
          previousStatus: item.status,
          newStatus: "NOT_COMPLETED",
          correctiveAction,
          correctionDueDate,
        }),
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Error marking item not completed:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
