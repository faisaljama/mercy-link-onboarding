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

    const checklist = await prisma.qAChecklist.findFirst({
      where: {
        id,
        OR: [
          { houseId: { in: houseIds } },
          { houseId: null },
        ],
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    return NextResponse.json({ checklist });
  } catch (error) {
    console.error("Error fetching QA checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch QA checklist" },
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

    // Only admins and DCs can update checklists
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if checklist exists and user has access
    const existingChecklist = await prisma.qAChecklist.findFirst({
      where: {
        id,
        OR: [
          { houseId: { in: houseIds } },
          { houseId: null },
        ],
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      items,
      overallNotes,
      followUpRequired,
      followUpDate,
      followUpNotes,
    } = data;

    // Determine status based on items
    let status = "IN_PROGRESS";
    if (items && items.length > 0) {
      const hasIncomplete = items.some((item: { value: string }) => !item.value);
      const hasNO = items.some((item: { value: string }) => item.value === "NO");

      if (!hasIncomplete) {
        status = hasNO ? "NEEDS_ATTENTION" : "COMPLETED";
      }
    }

    // Update checklist
    const checklist = await prisma.qAChecklist.update({
      where: { id },
      data: {
        items: JSON.stringify(items || []),
        overallNotes: overallNotes || null,
        status,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes: followUpNotes || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "QA_CHECKLIST",
        entityId: checklist.id,
        details: JSON.stringify({
          status,
          followUpRequired,
        }),
      },
    });

    return NextResponse.json({ checklist });
  } catch (error) {
    console.error("Error updating QA checklist:", error);
    return NextResponse.json(
      { error: "Failed to update QA checklist" },
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

    // Only admins can delete checklists
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if checklist exists
    const existingChecklist = await prisma.qAChecklist.findUnique({
      where: { id },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    // Delete checklist
    await prisma.qAChecklist.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "QA_CHECKLIST",
        entityId: id,
        details: JSON.stringify({
          type: existingChecklist.checklistType,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting QA checklist:", error);
    return NextResponse.json(
      { error: "Failed to delete QA checklist" },
      { status: 500 }
    );
  }
}
