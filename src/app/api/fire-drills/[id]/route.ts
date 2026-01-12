import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const drill = await prisma.fireDrill.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
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

    if (!drill) {
      return NextResponse.json(
        { error: "Fire drill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ drill });
  } catch (error) {
    console.error("Error fetching fire drill:", error);
    return NextResponse.json(
      { error: "Failed to fetch fire drill" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if drill exists and user has access
    const existing = await prisma.fireDrill.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Fire drill not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { drillDate, drillTime, participants, summary } = body;

    const drill = await prisma.fireDrill.update({
      where: { id },
      data: {
        drillDate: drillDate ? new Date(drillDate) : undefined,
        drillTime,
        participants: participants ? JSON.stringify(participants) : undefined,
        summary,
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

    return NextResponse.json({ drill });
  } catch (error) {
    console.error("Error updating fire drill:", error);
    return NextResponse.json(
      { error: "Failed to update fire drill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete fire drills
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can delete fire drills" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.fireDrill.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Fire drill not found" },
        { status: 404 }
      );
    }

    await prisma.fireDrill.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fire drill:", error);
    return NextResponse.json(
      { error: "Failed to delete fire drill" },
      { status: 500 }
    );
  }
}
