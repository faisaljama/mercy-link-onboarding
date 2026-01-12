import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    const receivable = await prisma.accountsReceivable.findUnique({
      where: { id },
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        attendanceReport: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Accounts receivable entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ receivable });
  } catch (error) {
    console.error("Error fetching accounts receivable:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts receivable entry" },
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
    const body = await request.json();
    const { status, resolvedNotes, amountCollected, reasonNotes } = body;

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;

      if (status === "COLLECTED" || status === "WRITTEN_OFF" || status === "RESOLVED") {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = session.id;
      }
    }

    if (resolvedNotes !== undefined) {
      updateData.resolvedNotes = resolvedNotes;
    }

    if (amountCollected !== undefined) {
      updateData.amountCollected = amountCollected;
    }

    if (reasonNotes !== undefined) {
      updateData.reasonNotes = reasonNotes;
    }

    const receivable = await prisma.accountsReceivable.update({
      where: { id },
      data: updateData,
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
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ receivable });
  } catch (error) {
    console.error("Error updating accounts receivable:", error);
    return NextResponse.json(
      { error: "Failed to update accounts receivable entry" },
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

    // Only admins can delete
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete accounts receivable entries" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.accountsReceivable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting accounts receivable:", error);
    return NextResponse.json(
      { error: "Failed to delete accounts receivable entry" },
      { status: 500 }
    );
  }
}
