import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("house");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseFilter !== "all") {
      whereClause.houseId = houseFilter;
    }

    // Filter by month/year using the date field
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const reports = await prisma.dailyOperationsReport.findMany({
      where: whereClause,
      include: {
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: "desc" }],
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching daily operations reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily operations reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { houseId, date } = data;

    // Validate required fields
    if (!houseId || !date) {
      return NextResponse.json(
        { error: "House and date are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const houseIds = await getUserHouseIds(session.id);
    if (!houseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Check if report already exists for this house/date
    const reportDate = new Date(date);
    const existing = await prisma.dailyOperationsReport.findFirst({
      where: { houseId, date: reportDate },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A report already exists for this date. Please edit the existing report." },
        { status: 400 }
      );
    }

    // Get census count (active clients in this house)
    const censusCount = await prisma.client.count({
      where: { houseId, status: "ACTIVE" },
    });

    const report = await prisma.dailyOperationsReport.create({
      data: {
        houseId,
        date: reportDate,
        censusCount,
        createdById: session.id,
      },
      include: {
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "DAILY_OPERATIONS_REPORT",
        entityId: report.id,
        details: JSON.stringify({
          houseId,
          date: reportDate.toISOString(),
        }),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error creating daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to create daily operations report" },
      { status: 500 }
    );
  }
}
