import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

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
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.dailyOperationsReport.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Can only submit if currently in DRAFT
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Report has already been submitted" },
        { status: 400 }
      );
    }

    const report = await prisma.dailyOperationsReport.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedById: session.id,
        submittedAt: new Date(),
      },
      include: {
        house: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "STATUS_CHANGE",
        entityType: "DAILY_OPERATIONS_REPORT",
        entityId: report.id,
        details: JSON.stringify({
          previousStatus: "DRAFT",
          newStatus: "SUBMITTED",
        }),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error submitting daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to submit daily operations report" },
      { status: 500 }
    );
  }
}
