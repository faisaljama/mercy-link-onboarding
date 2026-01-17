import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_STATUS,
  FORM_STATUS,
  ALL_FORMS,
  ONBOARDING_FORMS,
  FormType,
} from "@/lib/hr/constants";
import { FORM_ACKNOWLEDGMENTS } from "@/lib/hr/acknowledgments";

// POST /api/apply/[accessToken]/forms/[formType]/sign - Sign and complete form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string; formType: string }> }
) {
  try {
    const { accessToken, formType } = await params;
    const body = await request.json();

    // Validate form type
    if (!ALL_FORMS.includes(formType as FormType)) {
      return NextResponse.json(
        { error: "Invalid form type" },
        { status: 400 }
      );
    }

    // Validate signature data
    const { signatureTypedName, acknowledgments, formData } = body;

    if (!signatureTypedName || typeof signatureTypedName !== "string" || signatureTypedName.trim().length < 2) {
      return NextResponse.json(
        { error: "Signature (typed full legal name) is required" },
        { status: 400 }
      );
    }

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        formSubmissions: {
          where: { formType },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application is in editable state
    const editableStatuses: string[] = [
      APPLICATION_STATUS.DRAFT,
      APPLICATION_STATUS.APPROVED,
      APPLICATION_STATUS.ONBOARDING,
    ];
    if (!editableStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: "Application cannot be edited in current status" },
        { status: 403 }
      );
    }

    // Check if form is already signed
    const existingSubmission = application.formSubmissions[0];
    if (existingSubmission?.status === FORM_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: "Form has already been signed" },
        { status: 403 }
      );
    }

    // Validate acknowledgments if this form type has them
    const formAcks = FORM_ACKNOWLEDGMENTS[formType as FormType];
    if (formAcks) {
      const requiredItems = formAcks.items.filter((item) => item.required);
      const missingAcks: string[] = [];

      for (const item of requiredItems) {
        if (!acknowledgments || acknowledgments[item.id] !== true) {
          missingAcks.push(item.label);
        }
      }

      if (missingAcks.length > 0) {
        return NextResponse.json(
          {
            error: "All required acknowledgments must be checked",
            missingAcknowledgments: missingAcks,
          },
          { status: 400 }
        );
      }
    }

    // Get client IP and user agent for signature record
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Upsert form submission with signature
    const submission = await prisma.formSubmission.upsert({
      where: {
        applicationId_formType: {
          applicationId: application.id,
          formType,
        },
      },
      create: {
        applicationId: application.id,
        formType,
        status: FORM_STATUS.COMPLETED,
        formData: formData ?? {},
        acknowledgments: acknowledgments ?? null,
        signedAt: new Date(),
        signatureTypedName: signatureTypedName.trim(),
        signatureIpAddress: ipAddress,
        signatureUserAgent: userAgent.substring(0, 500),
      },
      update: {
        status: FORM_STATUS.COMPLETED,
        formData: formData ?? {},
        acknowledgments: acknowledgments ?? null,
        signedAt: new Date(),
        signatureTypedName: signatureTypedName.trim(),
        signatureIpAddress: ipAddress,
        signatureUserAgent: userAgent.substring(0, 500),
      },
    });

    // Check if we need to update application status
    await checkAndUpdateApplicationStatus(application.id);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: "system",
        action: "FORM_SIGNED",
        entityType: "FORM_SUBMISSION",
        entityId: submission.id,
        details: JSON.stringify({
          formType,
          applicationId: application.id,
          applicantEmail: application.email,
          signatureTypedName: signatureTypedName.trim(),
          signedAt: submission.signedAt,
        }),
        ipAddress,
      },
    });

    return NextResponse.json({
      formType,
      status: submission.status,
      signedAt: submission.signedAt,
      message: "Form signed successfully",
    });
  } catch (error) {
    console.error("Error signing form:", error);
    return NextResponse.json(
      { error: "Failed to sign form" },
      { status: 500 }
    );
  }
}

// Helper to check and update application status based on form completion
async function checkAndUpdateApplicationStatus(applicationId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      formSubmissions: true,
    },
  });

  if (!application) return;

  const completedForms = application.formSubmissions.filter(
    (s) => s.status === FORM_STATUS.COMPLETED
  );

  // If in APPROVED status and user starts completing onboarding forms, move to ONBOARDING
  if (application.status === APPLICATION_STATUS.APPROVED) {
    const hasOnboardingProgress = completedForms.some((s) =>
      ONBOARDING_FORMS.includes(s.formType as FormType)
    );
    if (hasOnboardingProgress) {
      await prisma.jobApplication.update({
        where: { id: applicationId },
        data: { status: APPLICATION_STATUS.ONBOARDING },
      });
    }
  }

  // If in ONBOARDING status and all forms are complete, move to COMPLETED
  if (application.status === APPLICATION_STATUS.ONBOARDING) {
    const allFormsComplete = [...ALL_FORMS].every((formType) =>
      completedForms.some((s) => s.formType === formType)
    );
    if (allFormsComplete) {
      await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: APPLICATION_STATUS.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Notify HR users that application is ready for employee creation
      await notifyHRApplicationCompleted(applicationId, application.email, application.firstName, application.lastName);
    }
  }
}

// Helper to notify HR users when an application is completed
async function notifyHRApplicationCompleted(
  applicationId: string,
  email: string,
  firstName: string | null,
  lastName: string | null
) {
  const hrUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "DESIGNATED_COORDINATOR"] },
    },
    select: { id: true },
  });

  const applicantName = [firstName, lastName].filter(Boolean).join(" ") || email;

  for (const user of hrUsers) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Application Ready for Hire",
        message: `${applicantName} has completed all onboarding forms and is ready to be converted to an employee.`,
        type: "SYSTEM",
        link: `/dashboard/hr/applications/${applicationId}`,
      },
    });
  }
}
