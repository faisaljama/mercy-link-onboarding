import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// Helper to calculate bi-monthly period from a date
function getBiMonthlyPeriod(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  return Math.ceil(month / 2); // 1=Jan-Feb, 2=Mar-Apr, etc.
}

// Helper to get period label
function getPeriodLabel(period: number): string {
  const labels: Record<number, string> = {
    1: "Jan-Feb",
    2: "Mar-Apr",
    3: "May-Jun",
    4: "Jul-Aug",
    5: "Sep-Oct",
    6: "Nov-Dec",
  };
  return labels[period] || "";
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseId) {
      where.houseId = houseId;
    }

    if (year) {
      where.year = parseInt(year);
    }

    const drills = await prisma.fireDrill.findMany({
      where,
      include: {
        house: true,
        completedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { biMonthlyPeriod: "desc" }],
    });

    // Get all houses to check completion status
    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      orderBy: { name: "asc" },
    });

    // Calculate current period
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentPeriod = getBiMonthlyPeriod(now);

    // Build completion matrix for each house
    const completionStatus = houses.map((house) => {
      const houseDrills = drills.filter((d) => d.houseId === house.id);
      const periods = [];

      for (let period = 1; period <= 6; period++) {
        const drill = houseDrills.find(
          (d) => d.biMonthlyPeriod === period && d.year === currentYear
        );
        const isPast = period < currentPeriod;
        const isCurrent = period === currentPeriod;

        periods.push({
          period,
          label: getPeriodLabel(period),
          completed: !!drill,
          drillId: drill?.id,
          drillDate: drill?.drillDate,
          isPast,
          isCurrent,
          isOverdue: isPast && !drill,
        });
      }

      return {
        house,
        periods,
        currentYearDrills: houseDrills.filter((d) => d.year === currentYear),
      };
    });

    return NextResponse.json({
      drills,
      houses,
      completionStatus,
      currentYear,
      currentPeriod,
    });
  } catch (error) {
    console.error("Error fetching fire drills:", error);
    return NextResponse.json(
      { error: "Failed to fetch fire drills" },
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
    const { houseId, drillDate, drillTime, participants, summary } = body;

    // Validation
    if (!houseId || !drillDate || !drillTime) {
      return NextResponse.json(
        { error: "House, drill date, and time are required" },
        { status: 400 }
      );
    }

    const date = new Date(drillDate);
    const year = date.getFullYear();
    const biMonthlyPeriod = getBiMonthlyPeriod(date);

    // Check if a drill already exists for this house/period/year
    const existing = await prisma.fireDrill.findUnique({
      where: {
        houseId_biMonthlyPeriod_year: {
          houseId,
          biMonthlyPeriod,
          year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A fire drill for ${getPeriodLabel(biMonthlyPeriod)} ${year} already exists for this house`,
        },
        { status: 400 }
      );
    }

    const drill = await prisma.fireDrill.create({
      data: {
        houseId,
        drillDate: date,
        drillTime,
        biMonthlyPeriod,
        year,
        participants: JSON.stringify(participants || []),
        summary,
        completedById: session.id,
      },
      include: {
        house: true,
        completedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ drill }, { status: 201 });
  } catch (error) {
    console.error("Error creating fire drill:", error);
    return NextResponse.json(
      { error: "Failed to create fire drill" },
      { status: 500 }
    );
  }
}
