import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/shift-notes/[id]/review - Mark note as reviewed
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin, HR can review notes
    const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "You do not have permission to review notes" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get the note
    const note = await prisma.shiftNote.findUnique({
      where: { id },
      select: {
        id: true,
        houseId: true,
        reviewedById: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify user has access to this house
    const houseIds = await getUserHouseIds(session.id);
    if (!houseIds.includes(note.houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Check if already reviewed
    if (note.reviewedById) {
      return NextResponse.json(
        { error: "Note has already been reviewed" },
        { status: 400 }
      );
    }

    // Mark as reviewed
    const updatedNote = await prisma.shiftNote.update({
      where: { id },
      data: {
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reviewedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "SHIFT_NOTE",
        entityId: id,
        details: JSON.stringify({
          action: "marked_reviewed",
          clientName: `${updatedNote.client.firstName} ${updatedNote.client.lastName}`,
          staffName: `${updatedNote.submittedBy.firstName} ${updatedNote.submittedBy.lastName}`,
        }),
      },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Error reviewing note:", error);
    return NextResponse.json(
      { error: "Failed to review note" },
      { status: 500 }
    );
  }
}
