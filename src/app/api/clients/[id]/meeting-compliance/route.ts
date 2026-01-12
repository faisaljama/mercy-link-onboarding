import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { initializeChecklistState } from "@/lib/meeting-compliance-templates";
import { differenceInYears } from "date-fns";

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

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const meetings = await prisma.clientMeetingCompliance.findMany({
      where: { clientId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ year: "asc" }, { meetingType: "asc" }],
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching meeting compliance:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting compliance" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = await request.json();
    const { meetingType, meetingDate, notes } = data;

    if (!meetingType || !meetingDate) {
      return NextResponse.json(
        { error: "Meeting type and date are required" },
        { status: 400 }
      );
    }

    // Calculate year based on admission date
    const admissionDate = new Date(client.admissionDate);
    const parsedMeetingDate = new Date(meetingDate);
    const yearsSinceAdmission = differenceInYears(parsedMeetingDate, admissionDate);
    const year = Math.max(1, yearsSinceAdmission + 1);

    // Check if meeting already exists for this type and year
    const existingMeeting = await prisma.clientMeetingCompliance.findUnique({
      where: {
        clientId_meetingType_year: {
          clientId: id,
          meetingType,
          year,
        },
      },
    });

    if (existingMeeting) {
      return NextResponse.json(
        { error: `A ${meetingType.replace(/_/g, " ")} meeting for Year ${year} already exists` },
        { status: 400 }
      );
    }

    // Initialize empty checklist for this meeting type
    const checklistItems = JSON.stringify(initializeChecklistState(meetingType));

    const meeting = await prisma.clientMeetingCompliance.create({
      data: {
        clientId: id,
        meetingType,
        meetingDate: parsedMeetingDate,
        year,
        checklistItems,
        notes: notes || null,
        createdById: session.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CLIENT_MEETING_COMPLIANCE",
        entityId: meeting.id,
        details: JSON.stringify({
          clientId: id,
          meetingType,
          meetingDate,
          year,
        }),
      },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error creating meeting compliance:", error);
    return NextResponse.json(
      { error: "Failed to create meeting compliance" },
      { status: 500 }
    );
  }
}
