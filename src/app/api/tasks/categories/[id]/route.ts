import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update a task category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, and DC can update categories
    if (session.role === "DSP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    // Check if category exists
    const existing = await prisma.taskCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== existing.name) {
      const nameExists = await prisma.taskCategory.findUnique({
        where: { name },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.taskCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating task category:", error);
    return NextResponse.json(
      { error: "Failed to update task category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete categories
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if category exists
    const existing = await prisma.taskCategory.findUnique({
      where: { id },
      include: { tasks: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has tasks
    if (existing.tasks.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing tasks. Remove or reassign tasks first." },
        { status: 400 }
      );
    }

    await prisma.taskCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task category:", error);
    return NextResponse.json(
      { error: "Failed to delete task category" },
      { status: 500 }
    );
  }
}
