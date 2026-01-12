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

    // Only admins and coordinators can review
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Only administrators and coordinators can review reports" },
        { status: 403 }
      );
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

    // Can only review if currently in SUBMITTED
    if (existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Report must be submitted before it can be reviewed" },
        { status: 400 }
      );
    }

    const report = await prisma.dailyOperationsReport.update({
      where: { id },
      data: {
        status: "REVIEWED",
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
      include: {
        house: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
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
          previousStatus: "SUBMITTED",
          newStatus: "REVIEWED",
        }),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error reviewing daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to review daily operations report" },
      { status: 500 }
    );
  }
}
