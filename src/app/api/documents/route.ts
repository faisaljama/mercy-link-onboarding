import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const employeeId = searchParams.get("employeeId");
    const complianceItemId = searchParams.get("complianceItemId");

    const houseIds = await getUserHouseIds(session.id);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (clientId) {
      // Verify user has access to this client's house
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { houseId: true },
      });
      if (!client || !houseIds.includes(client.houseId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.clientId = clientId;
    }

    if (employeeId) {
      // Verify user has access to at least one of employee's houses
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { assignedHouses: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      const employeeHouseIds = employee.assignedHouses.map((h) => h.houseId);
      const hasAccess = employeeHouseIds.some((id) => houseIds.includes(id));
      if (!hasAccess && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.employeeId = employeeId;
    }

    if (complianceItemId) {
      where.complianceItemId = complianceItemId;
    }

    // If no filters, get all documents for accessible clients/employees
    if (!clientId && !employeeId && !complianceItemId) {
      const accessibleClients = await prisma.client.findMany({
        where: { houseId: { in: houseIds } },
        select: { id: true },
      });
      const accessibleEmployees = await prisma.employee.findMany({
        where: {
          assignedHouses: { some: { houseId: { in: houseIds } } },
        },
        select: { id: true },
      });

      where.OR = [
        { clientId: { in: accessibleClients.map((c) => c.id) } },
        { employeeId: { in: accessibleEmployees.map((e) => e.id) } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
        complianceItem: { select: { itemName: true, itemType: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string | null;
    const employeeId = formData.get("employeeId") as string | null;
    const complianceItemId = formData.get("complianceItemId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!clientId && !employeeId) {
      return NextResponse.json(
        { error: "Must specify clientId or employeeId" },
        { status: 400 }
      );
    }

    const houseIds = await getUserHouseIds(session.id);

    // Verify access
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { houseId: true },
      });
      if (!client || !houseIds.includes(client.houseId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { assignedHouses: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      const employeeHouseIds = employee.assignedHouses.map((h) => h.houseId);
      const hasAccess = employeeHouseIds.some((id) => houseIds.includes(id));
      if (!hasAccess && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFileName = `${timestamp}-${baseName}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/${uniqueFileName}`,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedById: session.id,
        clientId: clientId || null,
        employeeId: employeeId || null,
        complianceItemId: complianceItemId || null,
      },
      include: {
        uploadedBy: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
        complianceItem: { select: { itemName: true, itemType: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPLOAD",
        entityType: "DOCUMENT",
        entityId: document.id,
        details: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          clientId,
          employeeId,
          complianceItemId,
        }),
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
