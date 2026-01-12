import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get all training logs for an employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  // Verify employee access
  const employee = await prisma.employee.findFirst({
    where: {
      id,
      assignedHouses: {
        some: { houseId: { in: houseIds } },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const trainingLogs = await prisma.employeeTrainingLog.findMany({
    where: { employeeId: id },
    include: {
      createdBy: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ logType: "asc" }, { year: "desc" }],
  });

  return NextResponse.json({ trainingLogs });
}

// POST - Create a new training log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin/HR/DC can create training logs
  if (!["ADMIN", "HR", "DESIGNATED_COORDINATOR", "DESIGNATED_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  // Verify employee access
  const employee = await prisma.employee.findFirst({
    where: {
      id,
      assignedHouses: {
        some: { houseId: { in: houseIds } },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const { logType, year } = data;

  // Check for existing log
  const existing = await prisma.employeeTrainingLog.findFirst({
    where: { employeeId: id, logType, year },
  });

  if (existing) {
    return NextResponse.json(
      { error: `Training log for ${logType} year ${year} already exists` },
      { status: 400 }
    );
  }

  // Calculate required hours for annual training
  let hoursRequired: number | null = null;
  if (logType === "ANNUAL") {
    // Intensive services: <5 years = 24 hours, 5+ years = 12 hours
    // Basic services: <5 years = 12 hours, 5+ years = 8 hours
    // Default to intensive services rates
    hoursRequired = employee.experienceYears >= 5 ? 12 : 24;
  }

  const trainingLog = await prisma.employeeTrainingLog.create({
    data: {
      employeeId: id,
      logType,
      year: year || 0,
      hoursRequired,
      checklistItems: "{}",
      createdById: session.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      documents: true,
    },
  });

  return NextResponse.json({ trainingLog }, { status: 201 });
}
