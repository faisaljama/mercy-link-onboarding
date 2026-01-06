import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);

    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ houses });
  } catch (error) {
    console.error("Error fetching houses:", error);
    return NextResponse.json(
      { error: "Failed to fetch houses" },
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

    // Only admins can create houses
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, address, county, licenseNumber, capacity } = data;

    // Validate required fields
    if (!name || !address || !county) {
      return NextResponse.json(
        { error: "Name, address, and county are required" },
        { status: 400 }
      );
    }

    const house = await prisma.house.create({
      data: {
        name,
        address,
        county,
        licenseNumber: licenseNumber || null,
        capacity: capacity || 4,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "HOUSE",
        entityId: house.id,
        details: JSON.stringify({
          name,
          address,
          county,
        }),
      },
    });

    return NextResponse.json({ house });
  } catch (error) {
    console.error("Error creating house:", error);
    return NextResponse.json(
      { error: "Failed to create house" },
      { status: 500 }
    );
  }
}
