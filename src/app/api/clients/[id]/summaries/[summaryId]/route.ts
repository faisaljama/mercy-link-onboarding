import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can delete
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id, summaryId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const summary = await prisma.clientMonthlySummary.findFirst({
      where: { id: summaryId, clientId: id },
    });

    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    await prisma.clientMonthlySummary.delete({
      where: { id: summaryId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CLIENT_MONTHLY_SUMMARY",
        entityId: summaryId,
        details: JSON.stringify({
          clientId: id,
          month: summary.month,
          year: summary.year,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting summary:", error);
    return NextResponse.json(
      { error: "Failed to delete summary" },
      { status: 500 }
    );
  }
}
