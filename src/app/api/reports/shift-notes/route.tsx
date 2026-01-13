import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { ShiftNotesPDF, getShiftNotesFilename } from "@/lib/pdf-templates/shift-notes-pdf";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const noteType = searchParams.get("noteType");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    }

    const houseIds = await getUserHouseIds(session.id);

    // Get the client/resident
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: houseIds },
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        onePageProfile: {
          select: {
            preferredName: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build filter for notes
    const whereClause: Record<string, unknown> = {
      clientId,
      houseId: { in: houseIds },
    };

    // Date range filter
    if (startDate && endDate) {
      whereClause.shiftDate = {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      };
    } else if (startDate) {
      whereClause.shiftDate = {
        gte: startOfDay(parseISO(startDate)),
      };
    } else if (endDate) {
      whereClause.shiftDate = {
        lte: endOfDay(parseISO(endDate)),
      };
    }

    // Note type filter
    if (noteType) {
      whereClause.noteType = noteType;
    }

    // Get notes - ordered by shiftDate (the date the note is FOR)
    const notes = await prisma.shiftNote.findMany({
      where: whereClause,
      include: {
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { shiftDate: "desc" },
        { shiftType: "asc" },
      ],
    });

    // Transform data for PDF - only include shiftDate, NOT submittedAt
    const pdfNotes = notes.map((note) => ({
      id: note.id,
      noteType: note.noteType,
      shiftDate: note.shiftDate.toISOString(),
      shiftType: note.shiftType,
      content: note.content,
      submittedBy: {
        firstName: note.submittedBy.firstName,
        lastName: note.submittedBy.lastName,
      },
    }));

    const pdfResident = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      onePageProfile: client.onePageProfile,
    };

    const pdfHouse = {
      id: client.house.id,
      name: client.house.name,
    };

    const dateRange = startDate && endDate
      ? { start: startDate, end: endDate }
      : undefined;

    const pdfBuffer = await renderToBuffer(
      <ShiftNotesPDF
        notes={pdfNotes}
        resident={pdfResident}
        house={pdfHouse}
        dateRange={dateRange}
      />
    );

    const filename = getShiftNotesFilename(client, dateRange);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating shift notes PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
