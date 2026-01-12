import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - List chores for user's accessible houses
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const shiftFilter = searchParams.get("shift");
    const categoryFilter = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      whereClause.houseId = houseFilter;
    }

    if (activeOnly) {
      whereClause.isActive = true;
    }

    if (categoryFilter) {
      whereClause.category = categoryFilter;
    }

    const chores = await prisma.chore.findMany({
      where: whereClause,
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
      orderBy: [{ house: { name: "asc" } }, { category: "asc" }, { sortOrder: "asc" }],
    });

    // Filter by shift if specified (shifts is stored as JSON array string)
    let filteredChores = chores;
    if (shiftFilter) {
      filteredChores = chores.filter((chore) => {
        try {
          const shifts = JSON.parse(chore.shifts);
          return shifts.includes(shiftFilter);
        } catch {
          return false;
        }
      });
    }

    return NextResponse.json({ chores: filteredChores });
  } catch (error) {
    console.error("Error fetching chores:", error);
    return NextResponse.json(
      { error: "Failed to fetch chores" },
      { status: 500 }
    );
  }
}

// POST - Create new chore
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only certain roles can create chores
    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();
    const {
      houseId,
      name,
      description,
      category,
      shifts,
      requiresPhoto,
      isRequired,
      sortOrder,
    } = data;

    if (!houseId || !name || !category) {
      return NextResponse.json(
        { error: "houseId, name, and category are required" },
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

    // Validate category
    const validCategories = [
      "room_checks",
      "common_areas",
      "kitchen_meals",
      "medication_area",
      "safety",
      "laundry",
      "other",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate shifts
    const validShifts = ["day", "evening", "overnight"];
    const choreShifts = shifts || ["day", "evening", "overnight"];
    if (!choreShifts.every((s: string) => validShifts.includes(s))) {
      return NextResponse.json(
        { error: "Invalid shift value" },
        { status: 400 }
      );
    }

    const chore = await prisma.chore.create({
      data: {
        houseId,
        name,
        description: description || null,
        category,
        shifts: JSON.stringify(choreShifts),
        requiresPhoto: requiresPhoto || false,
        isRequired: isRequired !== false,
        sortOrder: sortOrder || 0,
        createdById: session.id,
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CHORE",
        entityId: chore.id,
        details: JSON.stringify({
          name,
          category,
          houseId,
          houseName: chore.house.name,
        }),
      },
    });

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Error creating chore:", error);
    return NextResponse.json(
      { error: "Failed to create chore" },
      { status: 500 }
    );
  }
}
