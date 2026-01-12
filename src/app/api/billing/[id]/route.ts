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

    const agreement = await prisma.serviceAgreement.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
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
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!agreement) {
      return NextResponse.json(
        { error: "Service agreement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agreement });
  } catch (error) {
    console.error("Error fetching service agreement:", error);
    return NextResponse.json(
      { error: "Failed to fetch service agreement" },
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

    // Check if agreement exists and user has access
    const existing = await prisma.serviceAgreement.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Service agreement not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      agreementNumber,
      serviceType,
      startDate,
      endDate,
      dailyRate,
      units,
      documentUrl,
      documentName,
      status,
      notes,
    } = body;

    // Auto-update status based on dates if not explicitly set
    let newStatus = status;
    if (!status && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();

      if (start > today) {
        newStatus = "PENDING";
      } else if (end < today) {
        newStatus = "EXPIRED";
      } else {
        newStatus = "ACTIVE";
      }
    }

    const agreement = await prisma.serviceAgreement.update({
      where: { id },
      data: {
        agreementNumber,
        serviceType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        dailyRate,
        units,
        documentUrl,
        documentName,
        status: newStatus,
        notes,
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

    return NextResponse.json({ agreement });
  } catch (error) {
    console.error("Error updating service agreement:", error);
    return NextResponse.json(
      { error: "Failed to update service agreement" },
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

    // Only ADMIN can delete agreements
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can delete service agreements" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.serviceAgreement.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Service agreement not found" },
        { status: 404 }
      );
    }

    await prisma.serviceAgreement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service agreement:", error);
    return NextResponse.json(
      { error: "Failed to delete service agreement" },
      { status: 500 }
    );
  }
}
