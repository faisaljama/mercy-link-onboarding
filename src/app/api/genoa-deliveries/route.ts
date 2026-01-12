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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseId) {
      where.houseId = houseId;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.deliveryDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const deliveries = await prisma.genoaDelivery.findMany({
      where,
      include: {
        house: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { deliveryDate: "desc" },
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error("Error fetching Genoa deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
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
      houseId,
      deliveryDate,
      deliveryTime,
      receivedById,
      clientId,
      isAllResidents,
      manifestPhotos,
      medicationsMatch,
      medicationsMatchNotes,
      properlyStored,
      properlyStoredNotes,
      notes,
    } = body;

    // Validation
    if (!houseId || !deliveryDate || !deliveryTime || !receivedById) {
      return NextResponse.json(
        { error: "House, delivery date, time, and receiver are required" },
        { status: 400 }
      );
    }

    // If medications don't match, notes are required
    if (medicationsMatch === false && !medicationsMatchNotes) {
      return NextResponse.json(
        { error: "Explanation is required when medications don't match" },
        { status: 400 }
      );
    }

    // If not properly stored, notes are required
    if (properlyStored === false && !properlyStoredNotes) {
      return NextResponse.json(
        { error: "Explanation is required when medications are not properly stored" },
        { status: 400 }
      );
    }

    // If not all residents, client is required
    if (!isAllResidents && !clientId) {
      return NextResponse.json(
        { error: "Client selection is required unless 'All Residents' is selected" },
        { status: 400 }
      );
    }

    const delivery = await prisma.genoaDelivery.create({
      data: {
        houseId,
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        receivedById,
        clientId: isAllResidents ? null : clientId,
        isAllResidents: isAllResidents || false,
        manifestPhotos: JSON.stringify(manifestPhotos || []),
        medicationsMatch,
        medicationsMatchNotes,
        properlyStored,
        properlyStoredNotes,
        notes,
      },
      include: {
        house: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error("Error creating Genoa delivery:", error);
    return NextResponse.json(
      { error: "Failed to create delivery" },
      { status: 500 }
    );
  }
}
