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

    const delivery = await prisma.genoaDelivery.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
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

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery" },
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

    // Check if delivery exists and user has access
    const existing = await prisma.genoaDelivery.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
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
    if (medicationsMatch === false && !medicationsMatchNotes) {
      return NextResponse.json(
        { error: "Explanation is required when medications don't match" },
        { status: 400 }
      );
    }

    if (properlyStored === false && !properlyStoredNotes) {
      return NextResponse.json(
        { error: "Explanation is required when medications are not properly stored" },
        { status: 400 }
      );
    }

    const delivery = await prisma.genoaDelivery.update({
      where: { id },
      data: {
        houseId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        deliveryTime,
        receivedById,
        clientId: isAllResidents ? null : clientId,
        isAllResidents,
        manifestPhotos: manifestPhotos ? JSON.stringify(manifestPhotos) : undefined,
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

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { error: "Failed to update delivery" },
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

    // Only ADMIN can delete deliveries
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can delete deliveries" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.genoaDelivery.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    await prisma.genoaDelivery.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery" },
      { status: 500 }
    );
  }
}
