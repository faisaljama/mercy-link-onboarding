import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/hub/resources/[id] - Get single resource
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

    const resource = await prisma.hubResource.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}

// PUT /api/hub/resources/[id] - Update resource (Admin, DM, DC only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.role !== "ADMIN" &&
      session.role !== "DESIGNATED_MANAGER" &&
      session.role !== "DESIGNATED_COORDINATOR"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { category, title, description, documentUrl, fileName, fileSize, sortOrder, tags, isActive } = body;

    const resource = await prisma.hubResource.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(title && { title }),
        description: description ?? undefined,
        ...(documentUrl && { documentUrl }),
        ...(fileName && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(tags !== undefined && { tags }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/hub/resources/[id] - Delete resource (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.hubResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
