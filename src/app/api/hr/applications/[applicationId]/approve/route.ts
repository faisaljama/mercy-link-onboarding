import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { APPLICATION_STATUS } from "@/lib/hr/constants";

// POST /api/hr/applications/[applicationId]/approve - Approve application
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

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Can only approve SUBMITTED or UNDER_REVIEW applications
    const approvableStatuses: string[] = [
      APPLICATION_STATUS.SUBMITTED,
      APPLICATION_STATUS.UNDER_REVIEW,
    ];
    if (!approvableStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: "Application cannot be approved in current status" },
        { status: 400 }
      );
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: APPLICATION_STATUS.APPROVED,
        reviewedById: session.id,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        reviewNotes: body.notes || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "APPROVE",
        entityType: "JOB_APPLICATION",
        entityId: applicationId,
        details: JSON.stringify({
          previousStatus: application.status,
          newStatus: APPLICATION_STATUS.APPROVED,
          notes: body.notes,
        }),
      },
    });

    // Send notification to applicant (via email in production)
    // For now, just log it
    console.log(`Application ${applicationId} approved. Applicant should be notified at ${application.email}`);

    return NextResponse.json({
      application: updatedApplication,
      message: "Application approved successfully",
    });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: "Failed to approve application" },
      { status: 500 }
    );
  }
}
