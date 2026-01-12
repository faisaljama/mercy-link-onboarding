import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// GET - List chore completions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const dateFilter = searchParams.get("date");
    const shiftFilter = searchParams.get("shift");
    const staffFilter = searchParams.get("staffId");

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      whereClause.houseId = houseFilter;
    }

    if (dateFilter) {
      const date = parseISO(dateFilter);
      whereClause.shiftDate = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      };
    }

    if (shiftFilter) {
      whereClause.shiftType = shiftFilter;
    }

    if (staffFilter) {
      whereClause.completedById = staffFilter;
    }

    const completions = await prisma.choreCompletion.findMany({
      where: whereClause,
      include: {
        chore: {
          select: {
            id: true,
            name: true,
            category: true,
            requiresPhoto: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ shiftDate: "desc" }, { completedAt: "desc" }],
    });

    return NextResponse.json({ completions });
  } catch (error) {
    console.error("Error fetching chore completions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chore completions" },
      { status: 500 }
    );
  }
}

// POST - Record chore completion
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      choreId,
      houseId,
      shiftDate,
      shiftType,
      completedById,
      photoUrls,
      notes,
    } = data;

    if (!choreId || !houseId || !shiftDate || !shiftType || !completedById) {
      return NextResponse.json(
        { error: "choreId, houseId, shiftDate, shiftType, and completedById are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const userHouseIds = await getUserHouseIds(session.id);
    if (!userHouseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Verify the chore exists and belongs to this house
    const chore = await prisma.chore.findFirst({
      where: {
        id: choreId,
        houseId,
        isActive: true,
      },
    });

    if (!chore) {
      return NextResponse.json(
        { error: "Chore not found" },
        { status: 404 }
      );
    }

    // Check if photo is required but not provided
    if (chore.requiresPhoto && (!photoUrls || photoUrls.length === 0)) {
      return NextResponse.json(
        { error: "This chore requires a photo" },
        { status: 400 }
      );
    }

    // Verify the staff member exists and is assigned to this house
    const staff = await prisma.employee.findFirst({
      where: {
        id: completedById,
        status: "ACTIVE",
        assignedHouses: {
          some: { houseId },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found or not assigned to this house" },
        { status: 404 }
      );
    }

    // Validate shift type
    const validShifts = ["day", "evening", "overnight"];
    if (!validShifts.includes(shiftType)) {
      return NextResponse.json(
        { error: "Invalid shift type" },
        { status: 400 }
      );
    }

    // Check if completion already exists for this chore/date/shift
    const existingCompletion = await prisma.choreCompletion.findUnique({
      where: {
        choreId_shiftDate_shiftType: {
          choreId,
          shiftDate: startOfDay(parseISO(shiftDate)),
          shiftType,
        },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "This chore has already been completed for this shift" },
        { status: 400 }
      );
    }

    const completion = await prisma.choreCompletion.create({
      data: {
        choreId,
        houseId,
        shiftDate: startOfDay(parseISO(shiftDate)),
        shiftType,
        completedById,
        photoUrls: JSON.stringify(photoUrls || []),
        notes: notes || null,
      },
      include: {
        chore: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ completion });
  } catch (error) {
    console.error("Error recording chore completion:", error);
    return NextResponse.json(
      { error: "Failed to record chore completion" },
      { status: 500 }
    );
  }
}
