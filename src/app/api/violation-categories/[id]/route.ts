import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/violation-categories/[id] - Get single category
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

    const category = await prisma.violationCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching violation category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/violation-categories/[id] - Update category (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update violation categories" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      categoryName,
      severityLevel,
      defaultPoints,
      description,
      displayOrder,
      isActive,
    } = body;

    const existing = await prisma.violationCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const category = await prisma.violationCategory.update({
      where: { id },
      data: {
        categoryName: categoryName ?? existing.categoryName,
        severityLevel: severityLevel ?? existing.severityLevel,
        defaultPoints:
          defaultPoints !== undefined
            ? parseInt(defaultPoints)
            : existing.defaultPoints,
        description: description !== undefined ? description : existing.description,
        displayOrder:
          displayOrder !== undefined ? displayOrder : existing.displayOrder,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "VIOLATION_CATEGORY",
        entityId: category.id,
        details: JSON.stringify({
          categoryName: category.categoryName,
          severityLevel: category.severityLevel,
          defaultPoints: category.defaultPoints,
          isActive: category.isActive,
        }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating violation category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/violation-categories/[id] - Soft delete category (Admin only)
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
      return NextResponse.json(
        { error: "Only administrators can delete violation categories" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.violationCategory.findUnique({
      where: { id },
      include: { correctiveActions: { take: 1 } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If category has corrective actions, soft delete (set isActive = false)
    if (existing.correctiveActions.length > 0) {
      await prisma.violationCategory.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Otherwise hard delete
      await prisma.violationCategory.delete({
        where: { id },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "VIOLATION_CATEGORY",
        entityId: id,
        details: JSON.stringify({
          categoryName: existing.categoryName,
          softDelete: existing.correctiveActions.length > 0,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting violation category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
