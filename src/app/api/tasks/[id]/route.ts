import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a single task
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        category: true,
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        completedBy: {
          select: { id: true, name: true },
        },
        approvedBy: {
          select: { id: true, name: true },
        },
        assignedUsers: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify access - user must have access to the house or task must be global
    if (task.houseId) {
      const houseIds = await getUserHouseIds(session.id);
      if (!houseIds.includes(task.houseId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, and DC can update tasks
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Cannot edit approved tasks
    if (existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot edit approved tasks" },
        { status: 400 }
      );
    }

    // Verify house access if houseId is being changed
    if (body.houseId && body.houseId !== existing.houseId) {
      const houseIds = await getUserHouseIds(session.id);
      if (!houseIds.includes(body.houseId)) {
        return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
      }
    }

    const {
      title,
      description,
      categoryId,
      priority,
      assignedUserIds,
      houseId,
      dueDate,
      isRecurring,
      recurringType,
    } = body;

    // Validate assigned users if provided
    if (assignedUserIds !== undefined && (!Array.isArray(assignedUserIds) || assignedUserIds.length === 0)) {
      return NextResponse.json(
        { error: "At least one person must be assigned" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (priority !== undefined) updateData.priority = priority;
    if (houseId !== undefined) updateData.houseId = houseId || null;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringType !== undefined) updateData.recurringType = recurringType || null;

    // Update month/year if due date changed
    if (dueDate !== undefined) {
      const dueDateObj = new Date(dueDate);
      updateData.dueDate = dueDateObj;
      updateData.month = dueDateObj.getMonth() + 1;
      updateData.year = dueDateObj.getFullYear();
    }

    // Handle assigned users update
    if (assignedUserIds !== undefined) {
      // Delete existing assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // Create new assignments
      await prisma.taskAssignment.createMany({
        data: assignedUserIds.map((userId: string) => ({
          taskId: id,
          userId,
        })),
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        completedBy: {
          select: { id: true, name: true },
        },
        approvedBy: {
          select: { id: true, name: true },
        },
        assignedUsers: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete tasks
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
