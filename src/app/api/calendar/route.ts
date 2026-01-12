import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

type RecurrenceType = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY";

// Generate dates for recurring events
function generateRecurringDates(
  startDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceEndDate: Date | null,
  maxOccurrences: number = 52 // Default max 1 year of weekly events
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  const endDate = recurrenceEndDate || addYears(startDate, 1); // Default to 1 year if no end date

  while (currentDate <= endDate && dates.length < maxOccurrences) {
    // Skip the first date as it's the parent event
    if (dates.length > 0 || currentDate > startDate) {
      dates.push(new Date(currentDate));
    }

    switch (recurrenceType) {
      case "DAILY":
        currentDate = addDays(currentDate, 1);
        break;
      case "WEEKLY":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "BIWEEKLY":
        currentDate = addWeeks(currentDate, 2);
        break;
      case "MONTHLY":
        currentDate = addMonths(currentDate, 1);
        break;
      case "YEARLY":
        currentDate = addYears(currentDate, 1);
        break;
    }
  }

  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const whereClause: {
      houseId: { in: string[] } | string;
      startDate?: { gte?: Date; lte?: Date };
    } = {
      houseId: houseId && houseIds.includes(houseId) ? houseId : { in: houseIds },
    };

    if (startDate || endDate) {
      whereClause.startDate = {};
      if (startDate) whereClause.startDate.gte = new Date(startDate);
      if (endDate) whereClause.startDate.lte = new Date(endDate);
    }

    const events = await prisma.houseCalendarEvent.findMany({
      where: whereClause,
      include: {
        house: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, name: true } },
        parentEvent: { select: { id: true, title: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const data = await request.json();
    const {
      houseId,
      clientId,
      eventType,
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
      isRecurring,
      recurrenceType,
      recurrenceEndDate,
    } = data;

    if (!houseId || !eventType || !title || !startDate) {
      return NextResponse.json(
        { error: "House, event type, title, and start date are required" },
        { status: 400 }
      );
    }

    // Verify access to house
    if (!houseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "Not authorized for this house" },
        { status: 403 }
      );
    }

    // If clientId provided, verify client belongs to the house
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, houseId },
      });
      if (!client) {
        return NextResponse.json(
          { error: "Client not found in this house" },
          { status: 404 }
        );
      }
    }

    // Validate recurring event data
    if (isRecurring && !recurrenceType) {
      return NextResponse.json(
        { error: "Recurrence type is required for recurring events" },
        { status: 400 }
      );
    }

    const eventStartDate = new Date(startDate);
    const eventEndDate = endDate ? new Date(endDate) : null;
    const recurEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

    // Calculate duration for recurring events
    const eventDuration = eventEndDate
      ? eventEndDate.getTime() - eventStartDate.getTime()
      : 0;

    // Create the parent/main event
    const event = await prisma.houseCalendarEvent.create({
      data: {
        houseId,
        clientId: clientId || null,
        eventType,
        title,
        description: description || null,
        location: location || null,
        startDate: eventStartDate,
        endDate: eventEndDate,
        allDay: allDay || false,
        isRecurring: isRecurring || false,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceEndDate: isRecurring ? recurEndDate : null,
        createdById: session.id,
      },
      include: {
        house: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Generate recurring event instances
    let childEventsCreated = 0;
    if (isRecurring && recurrenceType) {
      const recurringDates = generateRecurringDates(
        eventStartDate,
        recurrenceType as RecurrenceType,
        recurEndDate
      );

      // Create child events in batches
      const childEventData = recurringDates.map((date) => ({
        houseId,
        clientId: clientId || null,
        eventType,
        title,
        description: description || null,
        location: location || null,
        startDate: date,
        endDate: eventDuration ? new Date(date.getTime() + eventDuration) : null,
        allDay: allDay || false,
        isRecurring: false, // Child events are not themselves recurring
        parentEventId: event.id,
        createdById: session.id,
      }));

      if (childEventData.length > 0) {
        const result = await prisma.houseCalendarEvent.createMany({
          data: childEventData,
        });
        childEventsCreated = result.count;
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CALENDAR_EVENT",
        entityId: event.id,
        details: JSON.stringify({
          houseId,
          clientId,
          eventType,
          title,
          startDate,
          isRecurring,
          recurrenceType,
          childEventsCreated,
        }),
      },
    });

    return NextResponse.json({ event, childEventsCreated });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
