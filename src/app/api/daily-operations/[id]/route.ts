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

    const report = await prisma.dailyOperationsReport.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        house: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Get calendar events for this date and house
    const calendarEvents = await prisma.houseCalendarEvent.findMany({
      where: {
        houseId: report.houseId,
        startDate: {
          gte: new Date(report.date.setHours(0, 0, 0, 0)),
          lt: new Date(new Date(report.date).setHours(24, 0, 0, 0)),
        },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: "asc" },
    });

    // Get active clients for this house
    const clients = await prisma.client.findMany({
      where: { houseId: report.houseId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    });

    // Get employees assigned to this house
    const employees = await prisma.employeeHouse.findMany({
      where: { houseId: report.houseId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, position: true, status: true },
        },
      },
    });

    const activeEmployees = employees
      .filter((eh) => eh.employee.status === "ACTIVE")
      .map((eh) => eh.employee);

    return NextResponse.json({
      report,
      calendarEvents,
      clients,
      employees: activeEmployees,
    });
  } catch (error) {
    console.error("Error fetching daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily operations report" },
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

    // Verify access and get existing report
    const existing = await prisma.dailyOperationsReport.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only allow editing if status is DRAFT
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot edit a submitted or reviewed report" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const {
      censusCount,
      censusNotes,
      shiftStart,
      shiftEnd,
      staffOnDuty,
      medicationNotes,
      mealNotes,
      activitiesNotes,
      incidentNotes,
      maintenanceNotes,
      generalNotes,
    } = data;

    const report = await prisma.dailyOperationsReport.update({
      where: { id },
      data: {
        censusCount: censusCount !== undefined ? censusCount : existing.censusCount,
        censusNotes: censusNotes !== undefined ? censusNotes : existing.censusNotes,
        shiftStart: shiftStart ? new Date(shiftStart) : existing.shiftStart,
        shiftEnd: shiftEnd ? new Date(shiftEnd) : existing.shiftEnd,
        staffOnDuty: staffOnDuty !== undefined ? staffOnDuty : existing.staffOnDuty,
        medicationNotes: medicationNotes !== undefined ? medicationNotes : existing.medicationNotes,
        mealNotes: mealNotes !== undefined ? mealNotes : existing.mealNotes,
        activitiesNotes: activitiesNotes !== undefined ? activitiesNotes : existing.activitiesNotes,
        incidentNotes: incidentNotes !== undefined ? incidentNotes : existing.incidentNotes,
        maintenanceNotes: maintenanceNotes !== undefined ? maintenanceNotes : existing.maintenanceNotes,
        generalNotes: generalNotes !== undefined ? generalNotes : existing.generalNotes,
      },
      include: {
        house: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "DAILY_OPERATIONS_REPORT",
        entityId: report.id,
        details: JSON.stringify({ date: report.date }),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error updating daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to update daily operations report" },
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

    // Only admins and coordinators can delete
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    const existing = await prisma.dailyOperationsReport.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await prisma.dailyOperationsReport.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "DAILY_OPERATIONS_REPORT",
        entityId: id,
        details: JSON.stringify({
          houseId: existing.houseId,
          date: existing.date,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily operations report:", error);
    return NextResponse.json(
      { error: "Failed to delete daily operations report" },
      { status: 500 }
    );
  }
}
