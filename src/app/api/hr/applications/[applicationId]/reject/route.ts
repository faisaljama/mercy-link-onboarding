import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { APPLICATION_STATUS } from "@/lib/hr/constants";

// POST /api/hr/applications/[applicationId]/reject - Reject application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await request.json();

    if (!body.reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Can reject most statuses except HIRED or already REJECTED
    const nonRejectableStatuses: string[] = [
      APPLICATION_STATUS.HIRED,
      APPLICATION_STATUS.REJECTED,
    ];
    if (nonRejectableStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: "Application cannot be rejected in current status" },
        { status: 400 }
      );
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: APPLICATION_STATUS.REJECTED,
        reviewedById: session.id,
        reviewedAt: new Date(),
        rejectionReason: body.reason,
        reviewNotes: body.notes || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "REJECT",
        entityType: "JOB_APPLICATION",
        entityId: applicationId,
        details: JSON.stringify({
          previousStatus: application.status,
          newStatus: APPLICATION_STATUS.REJECTED,
          reason: body.reason,
          notes: body.notes,
        }),
      },
    });

    return NextResponse.json({
      application: updatedApplication,
      message: "Application rejected",
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    return NextResponse.json(
      { error: "Failed to reject application" },
      { status: 500 }
    );
  }
}
