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

    const rentPayment = await prisma.rentPayment.findFirst({
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
            rentAmount: true,
            checkDeliveryLocation: true,
          },
        },
        house: { select: { id: true, name: true } },
        enteredBy: { select: { id: true, name: true } },
        signedOffBy: { select: { id: true, name: true } },
      },
    });

    if (!rentPayment) {
      return NextResponse.json({ error: "Rent payment not found" }, { status: 404 });
    }

    return NextResponse.json({ rentPayment });
  } catch (error) {
    console.error("Error fetching rent payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch rent payment" },
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

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    const existing = await prisma.rentPayment.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rent payment not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      amountDue,
      amountPaid,
      paymentDate,
      paymentMethod,
      checkNumber,
      notes,
    } = data;

    const rentPayment = await prisma.rentPayment.update({
      where: { id },
      data: {
        amountDue: amountDue !== undefined ? amountDue : existing.amountDue,
        amountPaid: amountPaid !== undefined ? amountPaid : existing.amountPaid,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
        checkNumber: checkNumber !== undefined ? checkNumber : existing.checkNumber,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        enteredBy: { select: { name: true } },
        signedOffBy: { select: { name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "RENT_PAYMENT",
        entityId: rentPayment.id,
        details: JSON.stringify({ amountPaid, paymentMethod }),
      },
    });

    return NextResponse.json({ rentPayment });
  } catch (error) {
    console.error("Error updating rent payment:", error);
    return NextResponse.json(
      { error: "Failed to update rent payment" },
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

    // Only admins and coordinators can delete
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.rentPayment.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rent payment not found" }, { status: 404 });
    }

    await prisma.rentPayment.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "RENT_PAYMENT",
        entityId: id,
        details: JSON.stringify({
          clientId: existing.clientId,
          month: existing.month,
          year: existing.year,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rent payment:", error);
    return NextResponse.json(
      { error: "Failed to delete rent payment" },
      { status: 500 }
    );
  }
}
