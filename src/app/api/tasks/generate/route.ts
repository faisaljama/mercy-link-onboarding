import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";

// POST - Generate recurring tasks for the current or specified month
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and DC can generate tasks
    if (session.role !== "ADMIN" && session.role !== "DESIGNATED_COORDINATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const targetMonth = body.month ? parseInt(body.month) : now.getMonth() + 1;
    const targetYear = body.year ? parseInt(body.year) : now.getFullYear();

    // Find all recurring task templates
    // These are the original recurring tasks that were marked as recurring
    const recurringTasks = await prisma.task.findMany({
      where: {
        isRecurring: true,
        recurringType: { not: null },
      },
      include: {
        category: true,
        house: true,
      },
    });

    let tasksCreated = 0;
    const createdTasks: string[] = [];

    for (const task of recurringTasks) {
      // Check if a task with the same title already exists for this month/year
      const existingTask = await prisma.task.findFirst({
        where: {
          title: task.title,
          month: targetMonth,
          year: targetYear,
          houseId: task.houseId,
        },
      });

      if (existingTask) {
        continue; // Skip if task already exists for this period
      }

      // Calculate if this task should be generated based on recurring type
      const originalMonth = task.month;
      const originalYear = task.year;
      const monthsDiff =
        (targetYear - originalYear) * 12 + (targetMonth - originalMonth);

      let shouldGenerate = false;

      switch (task.recurringType) {
        case "MONTHLY":
          // Generate every month
          shouldGenerate = monthsDiff > 0;
          break;
        case "QUARTERLY":
          // Generate every 3 months
          shouldGenerate = monthsDiff > 0 && monthsDiff % 3 === 0;
          break;
        case "YEARLY":
          // Generate every 12 months (same month each year)
          shouldGenerate = monthsDiff > 0 && monthsDiff % 12 === 0;
          break;
      }

      if (!shouldGenerate) {
        continue;
      }

      // Calculate the new due date (same day of month, but in target month/year)
      const originalDueDate = new Date(task.dueDate);
      const dayOfMonth = originalDueDate.getDate();
      const newDueDate = new Date(targetYear, targetMonth - 1, dayOfMonth);

      // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
      if (newDueDate.getMonth() !== targetMonth - 1) {
        newDueDate.setDate(0); // Go to last day of previous month
      }

      // Create the new task
      await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          categoryId: task.categoryId,
          priority: task.priority,
          assignedRoles: task.assignedRoles,
          houseId: task.houseId,
          dueDate: newDueDate,
          month: targetMonth,
          year: targetYear,
          status: "PENDING",
          isRecurring: true,
          recurringType: task.recurringType,
          createdById: session.id,
        },
      });

      tasksCreated++;
      createdTasks.push(task.title);
    }

    // Also create notifications for the generated tasks
    if (tasksCreated > 0) {
      // Get all users who might be assigned to these tasks
      const users = await prisma.user.findMany({
        include: {
          assignedHouses: true,
        },
      });

      for (const user of users) {
        // Get the newly created tasks that match user's role
        const newTasks = await prisma.task.findMany({
          where: {
            month: targetMonth,
            year: targetYear,
            createdById: session.id,
            createdAt: {
              gte: new Date(Date.now() - 60000), // Created in last minute
            },
          },
        });

        const tasksForUser = newTasks.filter((t) => {
          try {
            const assignedRoles = JSON.parse(t.assignedRoles);
            return assignedRoles.includes(user.role);
          } catch {
            return false;
          }
        });

        if (tasksForUser.length > 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "Recurring Tasks Generated",
              message: `${tasksForUser.length} recurring task${tasksForUser.length > 1 ? "s have" : " has"} been generated for ${targetMonth}/${targetYear}`,
              type: "TASK_ASSIGNED",
              link: `/dashboard/tasks?month=${targetMonth}&year=${targetYear}`,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasksCreated,
      createdTasks,
      targetMonth,
      targetYear,
    });
  } catch (error) {
    console.error("Error generating recurring tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate recurring tasks" },
      { status: 500 }
    );
  }
}
