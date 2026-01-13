import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListTodo,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewTaskDialog } from "./new-task-dialog";
import { TaskTable } from "./task-table";
import { TaskFilters } from "./task-filters";
import { GenerateTasksButton } from "./generate-tasks-button";

interface SearchParams {
  month?: string;
  year?: string;
  status?: string;
  categoryId?: string;
  houseId?: string;
  priority?: string;
  assignedTo?: string;
}

async function getTasksData(
  houseIds: string[],
  searchParams: SearchParams
) {
  const now = new Date();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

  // Build where clause
  const where: Record<string, unknown> = {
    month,
    year,
    OR: [
      { houseId: { in: houseIds } },
      { houseId: null },
    ],
  };

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.categoryId) {
    where.categoryId = searchParams.categoryId;
  }

  if (searchParams.houseId) {
    where.houseId = searchParams.houseId;
    delete where.OR;
  }

  if (searchParams.priority) {
    where.priority = searchParams.priority;
  }

  if (searchParams.assignedTo) {
    where.assignedUsers = {
      some: { userId: searchParams.assignedTo },
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
    ],
  });

  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Fetch all users for assignment dropdown
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  // Seed categories if needed
  let categories = await prisma.taskCategory.findMany({
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    await prisma.taskCategory.createMany({
      data: [
        { name: "Compliance", color: "#EF4444" },
        { name: "Maintenance", color: "#F59E0B" },
        { name: "Training", color: "#8B5CF6" },
        { name: "Administrative", color: "#3B82F6" },
        { name: "Household", color: "#10B981" },
        { name: "Client Care", color: "#EC4899" },
      ],
    });
    categories = await prisma.taskCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  return { tasks, houses, categories, users, month, year };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { tasks, houses, categories, users, month, year } = await getTasksData(houseIds, params);

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

  const canCreate = session.role !== "LEAD_STAFF";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Tasks</h1>
          <p className="text-slate-500">
            Manage and track team tasks and to-dos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/tasks/print?month=${month}&year=${year}${params.status ? `&status=${params.status}` : ""}${params.categoryId ? `&categoryId=${params.categoryId}` : ""}${params.houseId ? `&houseId=${params.houseId}` : ""}${params.priority ? `&priority=${params.priority}` : ""}`}
              target="_blank"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Export
            </Link>
          </Button>
          {canCreate && (
            <>
              <GenerateTasksButton month={month} year={year} />
              <NewTaskDialog houses={houses} categories={categories} users={users} />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <ListTodo className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-yellow-600">{completed}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Incomplete</p>
                <p className="text-2xl font-bold text-orange-600">{incomplete}</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TaskFilters
        houses={houses}
        categories={categories}
        users={users}
        currentMonth={month}
        currentYear={year}
        currentFilters={params}
      />

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No tasks for this period</p>
              <p className="text-sm">Create a new task to get started</p>
            </div>
          ) : (
            <TaskTable tasks={tasks} userRole={session.role} userId={session.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
