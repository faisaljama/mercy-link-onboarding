import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, meetingId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const meeting = await prisma.clientMeetingCompliance.findFirst({
      where: { id: meetingId, clientId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, meetingId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify meeting exists
    const existingMeeting = await prisma.clientMeetingCompliance.findFirst({
      where: { id: meetingId, clientId: id },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      checklistItems,
      notes,
      caseManagerAbsent,
      docsSentDate,
      docsSentNotes,
    } = data;

    const updateData: Record<string, unknown> = {};

    if (checklistItems !== undefined) {
      updateData.checklistItems =
        typeof checklistItems === "string"
          ? checklistItems
          : JSON.stringify(checklistItems);
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    if (caseManagerAbsent !== undefined) {
      updateData.caseManagerAbsent = caseManagerAbsent;
    }

    if (docsSentDate !== undefined) {
      updateData.docsSentDate = docsSentDate ? new Date(docsSentDate) : null;
    }

    if (docsSentNotes !== undefined) {
      updateData.docsSentNotes = docsSentNotes || null;
    }

    const meeting = await prisma.clientMeetingCompliance.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "CLIENT_MEETING_COMPLIANCE",
        entityId: meeting.id,
        details: JSON.stringify({
          clientId: id,
          meetingType: meeting.meetingType,
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can delete
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id, meetingId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify meeting exists
    const existingMeeting = await prisma.clientMeetingCompliance.findFirst({
      where: { id: meetingId, clientId: id },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await prisma.clientMeetingCompliance.delete({
      where: { id: meetingId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CLIENT_MEETING_COMPLIANCE",
        entityId: meetingId,
        details: JSON.stringify({
          clientId: id,
          meetingType: existingMeeting.meetingType,
          year: existingMeeting.year,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
