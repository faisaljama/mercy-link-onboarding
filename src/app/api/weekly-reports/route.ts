import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { startOfWeek, endOfWeek } from "date-fns";

// GET - List weekly DC reports with filters
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const houseIds = await getUserHouseIds(session.id);
  const searchParams = request.nextUrl.searchParams;
  const houseId = searchParams.get("houseId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    houseId: { in: houseIds },
  };

  if (houseId && houseIds.includes(houseId)) {
    where.houseId = houseId;
  }

  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    where.weekStartDate = {
      gte: startDate,
      lte: endDate,
    };
  } else if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31);
    where.weekStartDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  if (status) {
    where.status = status;
  }

  const reports = await prisma.weeklyDCReport.findMany({
    where,
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
    orderBy: { weekStartDate: "desc" },
  });

  return NextResponse.json(reports);
}

// POST - Create new weekly DC report
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  if (!houseIds.includes(data.houseId)) {
    return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
  }

  // Calculate week start (Monday) and end (Sunday)
  const dateForWeek = new Date(data.weekOf || new Date());
  const weekStartDate = startOfWeek(dateForWeek, { weekStartsOn: 1 }); // Monday
  const weekEndDate = endOfWeek(dateForWeek, { weekStartsOn: 1 }); // Sunday

  // Check if report already exists for this house and week
  const existingReport = await prisma.weeklyDCReport.findFirst({
    where: {
      houseId: data.houseId,
      weekStartDate: weekStartDate,
    },
  });

  if (existingReport) {
    return NextResponse.json(
      { error: "A report already exists for this house and week" },
      { status: 400 }
    );
  }

  const report = await prisma.weeklyDCReport.create({
    data: {
      houseId: data.houseId,
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      status: "DRAFT",
      createdById: session.id,
      // Summary questions
      overallWeekRating: data.overallWeekRating || null,
      staffingCoverage: data.staffingCoverage || null,
      staffPerformance: data.staffPerformance || null,
      residentWellbeing: data.residentWellbeing || null,
      medicationIssues: data.medicationIssues || null,
      maintenanceConcerns: data.maintenanceConcerns || null,
      incidentsSummary: data.incidentsSummary || null,
      appointmentsCompleted: data.appointmentsCompleted || null,
      upcomingConcerns: data.upcomingConcerns || null,
      suppliesNeeded: data.suppliesNeeded || null,
      trainingNeeds: data.trainingNeeds || null,
      additionalNotes: data.additionalNotes || null,
      // Weekly tasks
      scheduleCreated: data.scheduleCreated || false,
      scheduleSubmitted: data.scheduleSubmitted || false,
      houseLeadMeeting: data.houseLeadMeeting || false,
      receiptsUploaded: data.receiptsUploaded || false,
      notionUpdated: data.notionUpdated || false,
      activitiesReviewed: data.activitiesReviewed || false,
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(report, { status: 201 });
}
