import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_STATUS,
  FORM_STATUS,
  PRE_HIRE_FORMS,
  ONBOARDING_FORMS,
  ALL_FORMS,
  FormType,
} from "@/lib/hr/constants";

// GET /api/apply/[accessToken]/forms/[formType] - Get form data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string; formType: string }> }
) {
  try {
    const { accessToken, formType } = await params;

    // Validate form type
    if (!ALL_FORMS.includes(formType as FormType)) {
      return NextResponse.json(
        { error: "Invalid form type" },
        { status: 400 }
      );
    }

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        formSubmissions: {
          where: { formType },
        },
        education: true,
        workHistory: { orderBy: { startDate: "desc" } },
        references: true,
        addressHistory: { orderBy: { fromDate: "desc" } },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if form is available based on application status
    const isPreHire = PRE_HIRE_FORMS.includes(formType as FormType);
    const isOnboarding = ONBOARDING_FORMS.includes(formType as FormType);

    if (isOnboarding) {
      const onboardingStatuses: string[] = [
        APPLICATION_STATUS.APPROVED,
        APPLICATION_STATUS.ONBOARDING,
        APPLICATION_STATUS.COMPLETED,
        APPLICATION_STATUS.HIRED,
      ];
      const canAccessOnboarding = onboardingStatuses.includes(application.status);

      if (!canAccessOnboarding) {
        return NextResponse.json(
          { error: "Onboarding forms are not available until application is approved" },
          { status: 403 }
        );
      }
    }

    const submission = application.formSubmissions[0];

    // Build pre-fill data from application
    const prefillData = buildPrefillData(application, formType as FormType);

    return NextResponse.json({
      formType,
      status: submission?.status ?? FORM_STATUS.NOT_STARTED,
      formData: submission?.formData ?? null,
      acknowledgments: submission?.acknowledgments ?? null,
      signedAt: submission?.signedAt ?? null,
      signatureTypedName: submission?.signatureTypedName ?? null,
      prefillData,
      isPreHire,
      isOnboarding,
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT /api/apply/[accessToken]/forms/[formType] - Save form progress
export async function PUT(
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

    // Check if form is already signed (completed)
    const existingSubmission = application.formSubmissions[0];
    if (existingSubmission?.status === FORM_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: "Form has already been signed and cannot be modified" },
        { status: 403 }
      );
    }

    // Upsert form submission
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
        status: FORM_STATUS.IN_PROGRESS,
        formData: body.formData ?? {},
        acknowledgments: body.acknowledgments ?? null,
      },
      update: {
        status: FORM_STATUS.IN_PROGRESS,
        formData: body.formData ?? {},
        acknowledgments: body.acknowledgments ?? null,
      },
    });

    return NextResponse.json({
      formType,
      status: submission.status,
      message: "Form progress saved",
    });
  } catch (error) {
    console.error("Error saving form:", error);
    return NextResponse.json(
      { error: "Failed to save form" },
      { status: 500 }
    );
  }
}

// Helper function to build pre-fill data
function buildPrefillData(
  application: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    streetAddress: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    dateOfBirth: Date | null;
    ssnLastFour: string | null;
    driversLicenseNumber: string | null;
    driversLicenseState: string | null;
  },
  formType: FormType
): Record<string, unknown> {
  const prefill: Record<string, unknown> = {};

  // Common fields for all forms
  prefill.employeeName = [application.firstName, application.middleName, application.lastName]
    .filter(Boolean)
    .join(" ");
  prefill.firstName = application.firstName;
  prefill.lastName = application.lastName;
  prefill.email = application.email;
  prefill.phone = application.phone;
  prefill.address = [application.streetAddress, application.city, application.state, application.zipCode]
    .filter(Boolean)
    .join(", ");
  prefill.streetAddress = application.streetAddress;
  prefill.city = application.city;
  prefill.state = application.state;
  prefill.zipCode = application.zipCode;

  // Form-specific prefill
  switch (formType) {
    case "DIRECT_DEPOSIT":
      prefill.ssnLastFour = application.ssnLastFour;
      break;
    case "EMERGENCY_CONTACT":
      prefill.dateOfBirth = application.dateOfBirth;
      prefill.position = "Direct Support Professional (DSP)";
      break;
    case "AUTO_INSURANCE":
      prefill.driversLicenseNumber = application.driversLicenseNumber;
      prefill.driversLicenseState = application.driversLicenseState;
      break;
    case "JOB_DESCRIPTION":
      prefill.position = "Direct Support Professional (DSP)";
      break;
  }

  return prefill;
}
