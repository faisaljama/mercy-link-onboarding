import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const status = searchParams.get("status");

    const houseIds = await getUserHouseIds(session.id);

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseId) {
      where.houseId = houseId;
    }

    if (status) {
      where.status = status;
    }

    const receivables = await prisma.accountsReceivable.findMany({
      where,
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        attendanceReport: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // Get available houses for the user
    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      orderBy: { name: "asc" },
    });

    // Calculate summary stats
    const pending = receivables.filter((r) => r.status === "PENDING");
    const totalOwed = pending.reduce((sum, r) => sum + Number(r.amountOwed), 0);
    const totalDays = pending.reduce((sum, r) => sum + r.daysUnbilled, 0);

    return NextResponse.json({
      receivables,
      houses,
      stats: {
        totalPending: pending.length,
        totalOwed,
        totalDays,
        collected: receivables.filter((r) => r.status === "COLLECTED").length,
        writtenOff: receivables.filter((r) => r.status === "WRITTEN_OFF").length,
      },
    });
  } catch (error) {
    console.error("Error fetching accounts receivable:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts receivable" },
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
    const {
      attendanceReportId,
      clientName,
      houseId,
      periodStart,
      periodEnd,
      daysUnbilled,
      dailyRate,
      reason,
      reasonNotes,
    } = body;

    // Validation
    if (!clientName || !houseId || !periodStart || !periodEnd || !reason) {
      return NextResponse.json(
        { error: "Client name, house, period, and reason are required" },
        { status: 400 }
      );
    }

    // Calculate amount owed
    const rate = dailyRate ? Number(dailyRate) : 0;
    const amountOwed = daysUnbilled * rate;

    const receivable = await prisma.accountsReceivable.create({
      data: {
        attendanceReportId: attendanceReportId || null,
        clientName,
        houseId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        daysUnbilled: daysUnbilled || 0,
        dailyRate: dailyRate || null,
        amountOwed,
        reason,
        reasonNotes: reasonNotes || null,
        createdById: session.id,
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
      },
    });

    return NextResponse.json({ receivable }, { status: 201 });
  } catch (error) {
    console.error("Error creating accounts receivable:", error);
    return NextResponse.json(
      { error: "Failed to create accounts receivable entry" },
      { status: 500 }
    );
  }
}
