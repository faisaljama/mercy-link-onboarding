import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can delete
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id, planId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const supportPlan = await prisma.clientSupportPlan.findFirst({
      where: { id: planId, clientId: id },
    });

    if (!supportPlan) {
      return NextResponse.json({ error: "Support plan not found" }, { status: 404 });
    }

    await prisma.clientSupportPlan.delete({
      where: { id: planId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CLIENT_SUPPORT_PLAN",
        entityId: planId,
        details: JSON.stringify({
          clientId: id,
          planType: supportPlan.planType,
          effectiveStartDate: supportPlan.effectiveStartDate,
          effectiveEndDate: supportPlan.effectiveEndDate,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting support plan:", error);
    return NextResponse.json(
      { error: "Failed to delete support plan" },
      { status: 500 }
    );
  }
}
