import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { name: true } },
        client: { select: { firstName: true, lastName: true, houseId: true } },
        employee: { select: { firstName: true, lastName: true, assignedHouses: true } },
        complianceItem: { select: { itemName: true, itemType: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify access
    const houseIds = await getUserHouseIds(session.id);
    if (document.client && !houseIds.includes(document.client.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (document.employee) {
      const employeeHouseIds = document.employee.assignedHouses.map((h: { houseId: string }) => h.houseId);
      const hasAccess = employeeHouseIds.some((id: string) => houseIds.includes(id));
      if (!hasAccess && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: { select: { houseId: true } },
        employee: { select: { assignedHouses: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only admins and designated coordinators can delete
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Verify access
    const houseIds = await getUserHouseIds(session.id);
    if (document.client && !houseIds.includes(document.client.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (document.employee) {
      const employeeHouseIds = document.employee.assignedHouses.map((h: { houseId: string }) => h.houseId);
      const hasAccess = employeeHouseIds.some((id: string) => houseIds.includes(id));
      if (!hasAccess && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), document.filePath);
      await unlink(filePath);
    } catch {
      // File may not exist, continue anyway
    }

    // Delete document record
    await prisma.document.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "DOCUMENT",
        entityId: id,
        details: JSON.stringify({
          fileName: document.fileName,
          clientId: document.clientId,
          employeeId: document.employeeId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
