import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Approve a completed task (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can approve tasks
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

    // Can only approve completed tasks
    if (existing.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed tasks can be approved" },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: session.id,
      },
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
      },
    });

    // Notify the person who completed the task
    if (task.completedById && task.completedById !== session.id) {
      await prisma.notification.create({
        data: {
          userId: task.completedById,
          title: "Task Approved",
          message: `Your task "${task.title}" has been approved`,
          type: "SYSTEM",
          link: `/dashboard/tasks/${task.id}`,
        },
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error approving task:", error);
    return NextResponse.json(
      { error: "Failed to approve task" },
      { status: 500 }
    );
  }
}
