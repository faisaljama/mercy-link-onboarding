import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DCs and Admins can sign off
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Only Designated Coordinators and Admins can sign off on rent payments" },
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

    if (existing.signedOffById) {
      return NextResponse.json(
        { error: "This payment has already been signed off" },
        { status: 400 }
      );
    }

    const rentPayment = await prisma.rentPayment.update({
      where: { id },
      data: {
        signedOffById: session.id,
        signedOffAt: new Date(),
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
        action: "SIGN_OFF",
        entityType: "RENT_PAYMENT",
        entityId: rentPayment.id,
        details: JSON.stringify({
          clientId: existing.clientId,
          month: existing.month,
          year: existing.year,
          amountPaid: existing.amountPaid,
        }),
      },
    });

    return NextResponse.json({ rentPayment });
  } catch (error) {
    console.error("Error signing off rent payment:", error);
    return NextResponse.json(
      { error: "Failed to sign off rent payment" },
      { status: 500 }
    );
  }
}
