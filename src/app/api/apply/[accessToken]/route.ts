import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS } from "@/lib/hr/constants";
import { encryptSSN, getSSNLastFour } from "@/lib/hr/encryption";

// GET /api/apply/[accessToken] - Get application data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        education: true,
        workHistory: { orderBy: { startDate: "desc" } },
        references: true,
        addressHistory: { orderBy: { fromDate: "desc" } },
        formSubmissions: true,
        documents: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Don't return encrypted SSN, only last 4
    const { ssnEncrypted, ...safeApplication } = application;

    return NextResponse.json({
      ...safeApplication,
      hasSSN: !!ssnEncrypted,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PUT /api/apply/[accessToken] - Update application data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;
    const body = await request.json();

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can be edited
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

    // Handle SSN encryption if provided
    let ssnData = {};
    if (body.ssn) {
      const encrypted = encryptSSN(body.ssn);
      const lastFour = getSSNLastFour(body.ssn);
      ssnData = {
        ssnEncrypted: encrypted,
        ssnLastFour: lastFour,
      };
      delete body.ssn;
    }

    // Handle nested relations
    const {
      education,
      workHistory,
      references,
      addressHistory,
      ...applicationData
    } = body;

    // Update application
    const updatedApplication = await prisma.jobApplication.update({
      where: { accessToken },
      data: {
        ...applicationData,
        ...ssnData,
        // Handle education
        ...(education && {
          education: {
            deleteMany: {},
            create: education,
          },
        }),
        // Handle work history
        ...(workHistory && {
          workHistory: {
            deleteMany: {},
            create: workHistory,
          },
        }),
        // Handle references
        ...(references && {
          references: {
            deleteMany: {},
            create: references,
          },
        }),
        // Handle address history
        ...(addressHistory && {
          addressHistory: {
            deleteMany: {},
            create: addressHistory,
          },
        }),
      },
      include: {
        education: true,
        workHistory: true,
        references: true,
        addressHistory: true,
      },
    });

    // Don't return encrypted SSN
    const { ssnEncrypted, ...safeApplication } = updatedApplication;

    return NextResponse.json({
      ...safeApplication,
      hasSSN: !!ssnEncrypted,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
