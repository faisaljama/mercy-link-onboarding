import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    if (!houseIds.includes(id)) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: { where: { status: "ACTIVE" } },
            employees: true,
          },
        },
      },
    });

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    return NextResponse.json({ house });
  } catch (error) {
    console.error("Error fetching house:", error);
    return NextResponse.json(
      { error: "Failed to fetch house" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update houses
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if house exists
    const existingHouse = await prisma.house.findUnique({
      where: { id },
    });

    if (!existingHouse) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    const data = await request.json();
    const { name, address, county, licenseNumber, capacity, eveningEndsMidnight } = data;

    // Validate required fields
    if (!name || !address || !county) {
      return NextResponse.json(
        { error: "Name, address, and county are required" },
        { status: 400 }
      );
    }

    // Update house
    const house = await prisma.house.update({
      where: { id },
      data: {
        name,
        address,
        county,
        licenseNumber: licenseNumber || null,
        capacity: capacity || 4,
        eveningEndsMidnight: typeof eveningEndsMidnight === "boolean" ? eveningEndsMidnight : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "HOUSE",
        entityId: house.id,
        details: JSON.stringify({
          name,
          address,
          county,
          licenseNumber,
          capacity,
        }),
      },
    });

    return NextResponse.json({ house });
  } catch (error) {
    console.error("Error updating house:", error);
    return NextResponse.json(
      { error: "Failed to update house" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete houses
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if house exists
    const existingHouse = await prisma.house.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: { where: { status: "ACTIVE" } },
            employees: true,
          },
        },
      },
    });

    if (!existingHouse) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Prevent deletion if house has active clients
    if (existingHouse._count.clients > 0) {
      return NextResponse.json(
        { error: "Cannot delete house with active clients. Please discharge or transfer clients first." },
        { status: 400 }
      );
    }

    // Delete house (cascades to UserHouse, EmployeeHouse)
    await prisma.house.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "HOUSE",
        entityId: id,
        details: JSON.stringify({
          name: existingHouse.name,
          address: existingHouse.address,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting house:", error);
    return NextResponse.json(
      { error: "Failed to delete house" },
      { status: 500 }
    );
  }
}
