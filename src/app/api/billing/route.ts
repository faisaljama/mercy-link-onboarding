import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const status = searchParams.get("status");
    const expiringSoon = searchParams.get("expiringSoon"); // Show agreements expiring within 45 days

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseId) {
      where.houseId = houseId;
    }

    if (status) {
      where.status = status;
    }

    // Filter for agreements expiring within 45 days
    if (expiringSoon === "true") {
      const today = new Date();
      const in45Days = new Date();
      in45Days.setDate(today.getDate() + 45);
      where.endDate = {
        gte: today,
        lte: in45Days,
      };
      where.status = "ACTIVE";
    }

    const agreements = await prisma.serviceAgreement.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      orderBy: [{ endDate: "asc" }],
    });

    // Get houses for filtering
    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      orderBy: { name: "asc" },
    });

    // Calculate billing summary by house
    const activeAgreements = agreements.filter((a) => a.status === "ACTIVE");

    // Group by house
    const houseSummaries = houses.map((house) => {
      const houseAgreements = activeAgreements.filter(
        (a) => a.houseId === house.id
      );
      const totalDailyRate = houseAgreements.reduce(
        (sum, a) => sum + Number(a.dailyRate),
        0
      );

      return {
        house,
        agreementCount: houseAgreements.length,
        totalDailyRate,
        totalMonthlyRate: totalDailyRate * 30,
        totalYearlyRate: totalDailyRate * 365,
      };
    });

    // Overall totals
    const overallDailyTotal = activeAgreements.reduce(
      (sum, a) => sum + Number(a.dailyRate),
      0
    );

    // Count expiring within 45 days
    const today = new Date();
    const in45Days = new Date();
    in45Days.setDate(today.getDate() + 45);
    const expiringCount = activeAgreements.filter((a) => {
      const endDate = new Date(a.endDate);
      return endDate >= today && endDate <= in45Days;
    }).length;

    return NextResponse.json({
      agreements,
      houses,
      houseSummaries,
      totals: {
        daily: overallDailyTotal,
        monthly: overallDailyTotal * 30,
        yearly: overallDailyTotal * 365,
        activeCount: activeAgreements.length,
        expiringCount,
      },
    });
  } catch (error) {
    console.error("Error fetching service agreements:", error);
    return NextResponse.json(
      { error: "Failed to fetch service agreements" },
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
      clientId,
      houseId,
      agreementNumber,
      serviceType,
      startDate,
      endDate,
      dailyRate,
      units,
      documentUrl,
      documentName,
      notes,
    } = body;

    // Validation
    if (!clientId || !houseId || !serviceType || !startDate || !endDate || !dailyRate) {
      return NextResponse.json(
        { error: "Client, house, service type, dates, and daily rate are required" },
        { status: 400 }
      );
    }

    // Determine status based on dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    let status = "ACTIVE";
    if (start > today) {
      status = "PENDING";
    } else if (end < today) {
      status = "EXPIRED";
    }

    const agreement = await prisma.serviceAgreement.create({
      data: {
        clientId,
        houseId,
        agreementNumber,
        serviceType,
        startDate: start,
        endDate: end,
        dailyRate,
        units: units || null,
        documentUrl,
        documentName,
        status,
        notes,
        createdById: session.id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ agreement }, { status: 201 });
  } catch (error) {
    console.error("Error creating service agreement:", error);
    return NextResponse.json(
      { error: "Failed to create service agreement" },
      { status: 500 }
    );
  }
}
