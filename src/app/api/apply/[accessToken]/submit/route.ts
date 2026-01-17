import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS, FORM_STATUS, PRE_HIRE_FORMS, FormType } from "@/lib/hr/constants";

// POST /api/apply/[accessToken]/submit - Submit application for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        formSubmissions: true,
        education: true,
        workHistory: true,
        references: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application is in DRAFT status
    if (application.status !== APPLICATION_STATUS.DRAFT) {
      return NextResponse.json(
        { error: "Application has already been submitted" },
        { status: 400 }
      );
    }

    // Verify all pre-hire forms are completed
    const completedForms = application.formSubmissions.filter(
      (s) => s.status === FORM_STATUS.COMPLETED
    );
    const completedFormTypes = completedForms.map((s) => s.formType);

    const missingForms = PRE_HIRE_FORMS.filter(
      (formType) => !completedFormTypes.includes(formType)
    );

    if (missingForms.length > 0) {
      return NextResponse.json(
        {
          error: "All pre-hire forms must be completed before submitting",
          missingForms,
        },
        { status: 400 }
      );
    }

    // Update application status to SUBMITTED
    const updatedApplication = await prisma.jobApplication.update({
      where: { accessToken },
      data: {
        status: APPLICATION_STATUS.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: "system",
        action: "APPLICATION_SUBMITTED",
        entityType: "JOB_APPLICATION",
        entityId: application.id,
        details: JSON.stringify({
          email: application.email,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // Send notification to HR about new application
    await notifyHRNewApplication(
      application.id,
      application.email,
      application.firstName,
      application.lastName
    );

    return NextResponse.json({
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        submittedAt: updatedApplication.submittedAt,
      },
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// Helper to notify HR users when a new application is submitted
async function notifyHRNewApplication(
  applicationId: string,
  email: string,
  firstName: string | null,
  lastName: string | null
) {
  // Get all ADMIN and DESIGNATED_COORDINATOR users
  const hrUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "DESIGNATED_COORDINATOR"] },
    },
    select: { id: true },
  });

  const applicantName = [firstName, lastName].filter(Boolean).join(" ") || email;

  // Create notification for each HR user
  for (const user of hrUsers) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "New Job Application",
        message: `${applicantName} has submitted a job application and is awaiting review.`,
        type: "SYSTEM",
        link: `/dashboard/hr/applications/${applicationId}`,
      },
    });
  }
}
