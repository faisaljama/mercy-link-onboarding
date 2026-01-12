import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// Attendance codes and their billability
const BILLABLE_CODES = ["P"];
const NON_BILLABLE_CODES = ["A", "H", "V", "DC"];

// Bi-weekly period anchor date: December 26, 2025
const ANCHOR_DATE = new Date("2025-12-26");
const PERIOD_DAYS = 14;

// Calculate bi-weekly period from a given date
export function getBiWeeklyPeriod(date: Date): { startDate: Date; endDate: Date } {
  const anchor = new Date(ANCHOR_DATE);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  anchor.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const periodIndex = Math.floor(diffDays / PERIOD_DAYS);

  const startDate = new Date(anchor);
  startDate.setDate(anchor.getDate() + periodIndex * PERIOD_DAYS);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + PERIOD_DAYS - 1);

  return { startDate, endDate };
}

// Generate list of bi-weekly periods for dropdown selection
export function generateBiWeeklyPeriods(count: number = 12): { startDate: Date; endDate: Date; label: string }[] {
  const periods: { startDate: Date; endDate: Date; label: string }[] = [];
  const today = new Date();
  const currentPeriod = getBiWeeklyPeriod(today);

  // Start from a few periods back
  const startPeriod = new Date(currentPeriod.startDate);
  startPeriod.setDate(startPeriod.getDate() - (3 * PERIOD_DAYS)); // 3 periods back

  for (let i = 0; i < count; i++) {
    const periodStart = new Date(startPeriod);
    periodStart.setDate(startPeriod.getDate() + i * PERIOD_DAYS);

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + PERIOD_DAYS - 1);

    const formatDate = (d: Date) => {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
    };

    periods.push({
      startDate: periodStart,
      endDate: periodEnd,
      label: `${formatDate(periodStart)} - ${formatDate(periodEnd)}`,
    });
  }

  return periods;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const houseIds = await getUserHouseIds(session.id);

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseId) {
      where.houseId = houseId;
    }

    if (startDate && endDate) {
      where.startDate = new Date(startDate);
      where.endDate = new Date(endDate);
    }

    const reports = await prisma.attendanceReport.findMany({
      where,
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ startDate: "desc" }],
    });

    // Get available houses for the user
    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      orderBy: { name: "asc" },
    });

    // Generate bi-weekly periods for the dropdown
    const periods = generateBiWeeklyPeriods(12);

    return NextResponse.json({
      reports,
      houses,
      periods,
    });
  } catch (error) {
    console.error("Error fetching attendance reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { houseId, startDate, endDate, entries, notes } = body;

    // Validation
    if (!houseId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "House, start date, and end date are required" },
        { status: 400 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "At least one attendance entry is required" },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Check if report already exists for this house/period
    const existing = await prisma.attendanceReport.findUnique({
      where: {
        houseId_startDate_endDate: {
          houseId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An attendance report already exists for this house and billing period" },
        { status: 400 }
      );
    }

    // Calculate totals for each entry
    const processedEntries = entries.map(
      (
        entry: {
          clientName: string;
          maId?: string;
          dailyRate?: number;
          notes?: string;
          days: Record<string, string>;
        },
        index: number
      ) => {
        let totalPresent = 0;
        let totalAbsent = 0;
        let billableDays = 0;
        let nonBillableDays = 0;

        // Count days based on attendance codes (14 days for bi-weekly)
        for (let day = 1; day <= 14; day++) {
          const code = entry.days[`day${day}`];
          if (code) {
            if (BILLABLE_CODES.includes(code)) {
              billableDays++;
              if (code === "P") {
                totalPresent++;
              }
            } else if (NON_BILLABLE_CODES.includes(code)) {
              nonBillableDays++;
              totalAbsent++;
            }
          }
        }

        return {
          clientName: entry.clientName,
          maId: entry.maId || null,
          dailyRate: entry.dailyRate || null,
          notes: entry.notes || null,
          sortOrder: index,
          totalPresent,
          totalAbsent,
          billableDays,
          nonBillableDays,
          ...entry.days,
        };
      }
    );

    // Create the attendance report with entries
    const report = await prisma.attendanceReport.create({
      data: {
        houseId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        notes,
        createdById: session.id,
        entries: {
          create: processedEntries,
        },
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance report:", error);
    return NextResponse.json(
      { error: "Failed to create attendance report" },
      { status: 500 }
    );
  }
}
