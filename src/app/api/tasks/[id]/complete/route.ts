import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Mark task as complete or incomplete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, and DC can complete tasks
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status || !["COMPLETED", "INCOMPLETE"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be COMPLETED or INCOMPLETE" },
        { status: 400 }
      );
    }

    // Incomplete requires a note
    if (status === "INCOMPLETE" && !note) {
      return NextResponse.json(
        { error: "A note is required when marking as incomplete" },
        { status: 400 }
      );
    }

    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Cannot mark approved tasks
    if (existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot modify approved tasks" },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: new Date(),
        completedById: session.id,
        completedNote: note || null,
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

    // If marked as COMPLETED, notify admins for approval
    if (status === "COMPLETED") {
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          id: { not: session.id },
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "Task Awaiting Approval",
            message: `"${task.title}" has been marked complete and needs approval`,
            type: "TASK_AWAITING_APPROVAL",
            link: `/dashboard/tasks/${task.id}`,
          })),
        });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}
