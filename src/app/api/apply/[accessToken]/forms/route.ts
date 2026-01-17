import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_STATUS,
  FORM_STATUS,
  PRE_HIRE_FORMS,
  ONBOARDING_FORMS,
  ALL_FORMS,
  FORM_METADATA,
  FormType,
} from "@/lib/hr/constants";

// GET /api/apply/[accessToken]/forms - Get all form statuses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        formSubmissions: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Build form status map
    const formStatusMap: Record<string, string> = {};
    for (const submission of application.formSubmissions) {
      formStatusMap[submission.formType] = submission.status;
    }

    // Determine which forms are available based on application status
    const approvedStatuses: string[] = [
      APPLICATION_STATUS.APPROVED,
      APPLICATION_STATUS.ONBOARDING,
      APPLICATION_STATUS.COMPLETED,
      APPLICATION_STATUS.HIRED,
    ];
    const canAccessOnboarding = approvedStatuses.includes(application.status);

    // Build response with all forms
    const forms = ALL_FORMS.map((formType) => {
      const metadata = FORM_METADATA[formType];
      const isPreHire = PRE_HIRE_FORMS.includes(formType);
      const isOnboarding = ONBOARDING_FORMS.includes(formType);

      return {
        formType,
        ...metadata,
        status: formStatusMap[formType] || FORM_STATUS.NOT_STARTED,
        isPreHire,
        isOnboarding,
        isAvailable: isPreHire || canAccessOnboarding,
      };
    });

    // Calculate progress
    const completedCount = application.formSubmissions.filter(
      (s) => s.status === FORM_STATUS.COMPLETED
    ).length;

    return NextResponse.json({
      applicationStatus: application.status,
      forms,
      progress: {
        completed: completedCount,
        total: ALL_FORMS.length,
        preHireCompleted: application.formSubmissions.filter(
          (s) =>
            PRE_HIRE_FORMS.includes(s.formType as FormType) &&
            s.status === FORM_STATUS.COMPLETED
        ).length,
        preHireTotal: PRE_HIRE_FORMS.length,
        onboardingCompleted: application.formSubmissions.filter(
          (s) =>
            ONBOARDING_FORMS.includes(s.formType as FormType) &&
            s.status === FORM_STATUS.COMPLETED
        ).length,
        onboardingTotal: ONBOARDING_FORMS.length,
      },
      canAccessOnboarding,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
