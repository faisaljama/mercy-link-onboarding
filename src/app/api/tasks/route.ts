import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const houseId = searchParams.get("houseId");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    // Default to current month/year
    const now = new Date();
    const filterMonth = month ? parseInt(month) : now.getMonth() + 1;
    const filterYear = year ? parseInt(year) : now.getFullYear();

    // Get user's accessible houses
    const houseIds = await getUserHouseIds(session.id);

    // Build where clause
    const where: Record<string, unknown> = {
      month: filterMonth,
      year: filterYear,
    };

    // Filter by house if specified, otherwise show tasks for user's houses or no house
    if (houseId) {
      if (!houseIds.includes(houseId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      where.houseId = houseId;
    } else {
      where.OR = [
        { houseId: { in: houseIds } },
        { houseId: null },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo) {
      where.assignedUsers = {
        some: { userId: assignedTo },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { priority: "desc" },
      ],
    });

    // Get houses for filters
    const houses = await prisma.house.findMany({
      where: { id: { in: houseIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Get categories for filters
    const categories = await prisma.taskCategory.findMany({
      orderBy: { name: "asc" },
    });

    // Get all users for assignment dropdown
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });

    // Calculate stats
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const approved = tasks.filter((t) => t.status === "APPROVED").length;
    const incomplete = tasks.filter((t) => t.status === "INCOMPLETE").length;
    const overdue = tasks.filter(
      (t) => (t.status === "PENDING" || t.status === "IN_PROGRESS") && new Date(t.dueDate) < new Date()
    ).length;

    return NextResponse.json({
      tasks,
      houses,
      categories,
      users,
      stats: { total, pending, inProgress, completed, approved, incomplete, overdue },
      filters: { month: filterMonth, year: filterYear },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, DC, and Operations can create tasks
    if (session.role === "DSP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
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

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: "Title and due date are required" },
        { status: 400 }
      );
    }

    // Validate assigned users
    if (!assignedUserIds || !Array.isArray(assignedUserIds) || assignedUserIds.length === 0) {
      return NextResponse.json(
        { error: "At least one person must be assigned" },
        { status: 400 }
      );
    }

    // Validate house access if houseId provided
    if (houseId) {
      const houseIds = await getUserHouseIds(session.id);
      if (!houseIds.includes(houseId)) {
        return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
      }
    }

    // Extract month and year from due date
    const dueDateObj = new Date(dueDate);
    const month = dueDateObj.getMonth() + 1;
    const year = dueDateObj.getFullYear();

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        categoryId: categoryId || null,
        priority: priority || "MEDIUM",
        assignedRoles: "[]", // Keep for backwards compatibility
        houseId: houseId || null,
        dueDate: dueDateObj,
        month,
        year,
        isRecurring: isRecurring || false,
        recurringType: recurringType || null,
        createdById: session.id,
        assignedUsers: {
          create: assignedUserIds.map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        category: true,
        house: {
          select: { id: true, name: true },
        },
        createdBy: {
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

    // Create notification for assigned users
    const usersToNotify = assignedUserIds.filter((id: string) => id !== session.id);

    if (usersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: usersToNotify.map((userId: string) => ({
          userId,
          title: "New Task Assigned",
          message: `You have been assigned: "${title}"`,
          type: "TASK_ASSIGNED",
          link: `/dashboard/tasks/${task.id}`,
        })),
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
