import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// GET - Get single training log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, logId } = await params;
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

  const trainingLog = await prisma.employeeTrainingLog.findFirst({
    where: { id: logId, employeeId: id },
    include: {
      createdBy: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!trainingLog) {
    return NextResponse.json({ error: "Training log not found" }, { status: 404 });
  }

  return NextResponse.json({ trainingLog });
}

// PUT - Update training log (checklist items, notes, signatures)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin/HR/DC can update training logs
  if (!["ADMIN", "HR", "DESIGNATED_COORDINATOR", "DESIGNATED_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id, logId } = await params;
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

  const existing = await prisma.employeeTrainingLog.findFirst({
    where: { id: logId, employeeId: id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Training log not found" }, { status: 404 });
  }

  // Calculate completed hours from checklist items
  let hoursCompleted = 0;
  if (data.checklistItems) {
    const items = typeof data.checklistItems === "string"
      ? JSON.parse(data.checklistItems)
      : data.checklistItems;

    // Sum up hours from completed items
    for (const [key, value] of Object.entries(items)) {
      const item = value as { completed?: boolean; hours?: number };
      if (item.completed && item.hours) {
        hoursCompleted += item.hours;
      }
    }
  }

  const trainingLog = await prisma.employeeTrainingLog.update({
    where: { id: logId },
    data: {
      checklistItems: typeof data.checklistItems === "string"
        ? data.checklistItems
        : JSON.stringify(data.checklistItems || {}),
      hoursCompleted,
      notes: data.notes,
      employeeSignature: data.employeeSignature,
      employeeSignedAt: data.employeeSignature && !existing.employeeSignedAt ? new Date() : existing.employeeSignedAt,
      supervisorSignature: data.supervisorSignature,
      supervisorSignedAt: data.supervisorSignature && !existing.supervisorSignedAt ? new Date() : existing.supervisorSignedAt,
      supervisorId: data.supervisorSignature && !existing.supervisorId ? session.id : existing.supervisorId,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ trainingLog });
}

// DELETE - Delete training log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin/HR can delete training logs
  if (!["ADMIN", "HR"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id, logId } = await params;

  const existing = await prisma.employeeTrainingLog.findFirst({
    where: { id: logId, employeeId: id },
    include: { documents: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Training log not found" }, { status: 404 });
  }

  // Delete associated files
  for (const doc of existing.documents) {
    try {
      await unlink(path.join(process.cwd(), "public", doc.filePath));
    } catch {
      // File may not exist
    }
  }

  await prisma.employeeTrainingLog.delete({
    where: { id: logId },
  });

  return NextResponse.json({ success: true });
}

// POST - Upload document to training log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, logId } = await params;
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

  const trainingLog = await prisma.employeeTrainingLog.findFirst({
    where: { id: logId, employeeId: id },
  });

  if (!trainingLog) {
    return NextResponse.json({ error: "Training log not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "training-docs");
  await mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}-${cleanName}`;
  const filePath = `/uploads/training-docs/${fileName}`;
  const fullPath = path.join(uploadsDir, fileName);

  // Write file
  const bytes = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(bytes));

  // Create document record
  const document = await prisma.employeeTrainingDocument.create({
    data: {
      trainingLogId: logId,
      fileName: file.name,
      filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadedById: session.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
