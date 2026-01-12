import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// GET - List shift notes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");
    const clientFilter = searchParams.get("clientId");
    const dateFilter = searchParams.get("date");
    const shiftFilter = searchParams.get("shift");
    const noteTypeFilter = searchParams.get("noteType");
    const staffFilter = searchParams.get("staffId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      whereClause.houseId = houseFilter;
    }

    if (clientFilter) {
      whereClause.clientId = clientFilter;
    }

    if (dateFilter) {
      const date = parseISO(dateFilter);
      whereClause.shiftDate = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      };
    }

    if (shiftFilter) {
      whereClause.shiftType = shiftFilter;
    }

    if (noteTypeFilter) {
      whereClause.noteType = noteTypeFilter;
    }

    if (staffFilter) {
      whereClause.submittedById = staffFilter;
    }

    const notes = await prisma.shiftNote.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ shiftDate: "desc" }, { submittedAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching shift notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift notes" },
      { status: 500 }
    );
  }
}

// POST - Create new shift note
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      clientId,
      houseId,
      noteType,
      shiftDate,
      shiftType,
      content,
      submittedById,
      signatureData,
    } = data;

    if (!clientId || !houseId || !noteType || !shiftDate || !shiftType || !content || !submittedById) {
      return NextResponse.json(
        { error: "clientId, houseId, noteType, shiftDate, shiftType, content, and submittedById are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this house
    const userHouseIds = await getUserHouseIds(session.id);
    if (!userHouseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to this house" },
        { status: 403 }
      );
    }

    // Verify the client exists and belongs to this house
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId,
        status: "ACTIVE",
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found at this house" },
        { status: 404 }
      );
    }

    // Verify the staff member exists
    const staff = await prisma.employee.findFirst({
      where: {
        id: submittedById,
        status: "ACTIVE",
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Validate note type
    const validNoteTypes = [
      "progress_note",
      "incident_report",
      "medication_note",
      "activity_note",
      "communication_log",
    ];
    if (!validNoteTypes.includes(noteType)) {
      return NextResponse.json(
        { error: "Invalid note type" },
        { status: 400 }
      );
    }

    // Validate shift type
    const validShifts = ["day", "evening", "overnight"];
    if (!validShifts.includes(shiftType)) {
      return NextResponse.json(
        { error: "Invalid shift type" },
        { status: 400 }
      );
    }

    const note = await prisma.shiftNote.create({
      data: {
        clientId,
        houseId,
        noteType,
        shiftDate: startOfDay(parseISO(shiftDate)),
        shiftType,
        content,
        submittedById,
        signatureData: signatureData || null,
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
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error creating shift note:", error);
    return NextResponse.json(
      { error: "Failed to create shift note" },
      { status: 500 }
    );
  }
}
