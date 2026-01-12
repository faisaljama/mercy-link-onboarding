import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// Attendance codes and their billability
const BILLABLE_CODES = ["P", "PP", "ER", "DT"];
const NON_BILLABLE_CODES = ["H", "NF", "FV", "D", "DC", "O"];

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
    const houseIds = await getUserHouseIds(session.id);

    const report = await prisma.attendanceReport.findUnique({
      where: { id },
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
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check access
    if (!houseIds.includes(report.houseId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance report" },
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
    const houseIds = await getUserHouseIds(session.id);

    // Check if report exists and user has access
    const existing = await prisma.attendanceReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!houseIds.includes(existing.houseId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { entries, notes, status } = body;

    // If updating entries, delete existing and recreate
    if (entries && entries.length > 0) {
      // Delete existing entries
      await prisma.attendanceEntry.deleteMany({
        where: { attendanceReportId: id },
      });

      // Calculate totals for each entry
      const processedEntries = entries.map(
        (
          entry: {
            clientName: string;
            maId?: string;
            dailyRate?: number;
            notes?: string;
            days: Record<string, string>;
          },
          index: number
        ) => {
          let totalPresent = 0;
          let totalAbsent = 0;
          let billableDays = 0;
          let nonBillableDays = 0;

          // Count days based on attendance codes
          for (let day = 1; day <= 31; day++) {
            const code = entry.days[`day${day}`];
            if (code) {
              if (BILLABLE_CODES.includes(code)) {
                billableDays++;
                if (code === "P") {
                  totalPresent++;
                }
              } else if (NON_BILLABLE_CODES.includes(code)) {
                nonBillableDays++;
                totalAbsent++;
              }
            }
          }

          return {
            attendanceReportId: id,
            clientName: entry.clientName,
            maId: entry.maId || null,
            dailyRate: entry.dailyRate || null,
            notes: entry.notes || null,
            sortOrder: index,
            totalPresent,
            totalAbsent,
            billableDays,
            nonBillableDays,
            ...entry.days,
          };
        }
      );

      // Create new entries
      await prisma.attendanceEntry.createMany({
        data: processedEntries,
      });
    }

    // Update report metadata
    const report = await prisma.attendanceReport.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status,
      },
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
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error updating attendance report:", error);
    return NextResponse.json(
      { error: "Failed to update attendance report" },
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

    // Only admins can delete reports
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete attendance reports" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if report exists
    const existing = await prisma.attendanceReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete the report (entries will cascade)
    await prisma.attendanceReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance report:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance report" },
      { status: 500 }
    );
  }
}
