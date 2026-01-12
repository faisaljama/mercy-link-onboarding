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

    const event = await prisma.houseCalendarEvent.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        house: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, name: true } },
        parentEvent: { select: { id: true, title: true } },
        childEvents: { select: { id: true, startDate: true }, orderBy: { startDate: "asc" } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar event" },
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

    // Check if event exists and user has access
    const existingEvent = await prisma.houseCalendarEvent.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      clientId,
      eventType,
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
    } = data;

    // If clientId provided, verify client belongs to the house
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, houseId: existingEvent.houseId },
      });
      if (!client) {
        return NextResponse.json(
          { error: "Client not found in this house" },
          { status: 404 }
        );
      }
    }

    const event = await prisma.houseCalendarEvent.update({
      where: { id },
      data: {
        clientId: clientId || null,
        eventType: eventType || existingEvent.eventType,
        title: title || existingEvent.title,
        description: description !== undefined ? description : existingEvent.description,
        location: location !== undefined ? location : existingEvent.location,
        startDate: startDate ? new Date(startDate) : existingEvent.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingEvent.endDate,
        allDay: allDay !== undefined ? allDay : existingEvent.allDay,
      },
      include: {
        house: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "CALENDAR_EVENT",
        entityId: event.id,
        details: JSON.stringify({
          eventType,
          title,
          startDate,
        }),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to update calendar event" },
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get("deleteAll") === "true";

    const houseIds = await getUserHouseIds(session.id);

    // Check if event exists and user has access
    const existingEvent = await prisma.houseCalendarEvent.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        childEvents: { select: { id: true } },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let deletedCount = 1;

    // If this is a recurring parent event and deleteAll is true, delete all child events
    if (existingEvent.isRecurring && deleteAll && existingEvent.childEvents.length > 0) {
      await prisma.houseCalendarEvent.deleteMany({
        where: { parentEventId: id },
      });
      deletedCount += existingEvent.childEvents.length;
    }

    // Delete the event itself
    await prisma.houseCalendarEvent.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CALENDAR_EVENT",
        entityId: id,
        details: JSON.stringify({
          title: existingEvent.title,
          houseId: existingEvent.houseId,
          startDate: existingEvent.startDate,
          isRecurring: existingEvent.isRecurring,
          deletedCount,
        }),
      },
    });

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar event" },
      { status: 500 }
    );
  }
}
