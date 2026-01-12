import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get single weekly report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  const report = await prisma.weeklyDCReport.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      submittedBy: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

// PUT - Update weekly report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  const existing = await prisma.weeklyDCReport.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Only allow updates to DRAFT reports
  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Cannot edit submitted or reviewed reports" },
      { status: 400 }
    );
  }

  const report = await prisma.weeklyDCReport.update({
    where: { id },
    data: {
      // Summary questions
      overallWeekRating: data.overallWeekRating,
      staffingCoverage: data.staffingCoverage,
      staffPerformance: data.staffPerformance,
      residentWellbeing: data.residentWellbeing,
      medicationIssues: data.medicationIssues,
      maintenanceConcerns: data.maintenanceConcerns,
      incidentsSummary: data.incidentsSummary,
      appointmentsCompleted: data.appointmentsCompleted,
      upcomingConcerns: data.upcomingConcerns,
      suppliesNeeded: data.suppliesNeeded,
      trainingNeeds: data.trainingNeeds,
      additionalNotes: data.additionalNotes,
      // Weekly tasks
      scheduleCreated: data.scheduleCreated,
      scheduleSubmitted: data.scheduleSubmitted,
      houseLeadMeeting: data.houseLeadMeeting,
      receiptsUploaded: data.receiptsUploaded,
      notionUpdated: data.notionUpdated,
      activitiesReviewed: data.activitiesReviewed,
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(report);
}

// DELETE - Delete weekly report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  const existing = await prisma.weeklyDCReport.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Only allow deletion of DRAFT reports
  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Cannot delete submitted or reviewed reports" },
      { status: 400 }
    );
  }

  await prisma.weeklyDCReport.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// POST - Submit report (change status to SUBMITTED)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  const existing = await prisma.weeklyDCReport.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Handle different actions
  const action = data.action;

  if (action === "submit") {
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Report is already submitted" },
        { status: 400 }
      );
    }

    const report = await prisma.weeklyDCReport.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedById: session.id,
        submittedAt: new Date(),
      },
      include: {
        house: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(report);
  } else if (action === "review") {
    // Only ADMIN or DM can review
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can review reports" },
        { status: 403 }
      );
    }

    if (existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Report must be submitted before review" },
        { status: 400 }
      );
    }

    const report = await prisma.weeklyDCReport.update({
      where: { id },
      data: {
        status: "REVIEWED",
        reviewedById: session.id,
        reviewedAt: new Date(),
        dmComments: data.dmComments || null,
      },
      include: {
        house: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(report);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
