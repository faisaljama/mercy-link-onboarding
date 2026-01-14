import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Home,
  User,
  Clock,
  CheckCircle2,
  Shield,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { TaskActions } from "./task-actions";
import { EditTaskForm } from "./edit-task-form";

async function getTaskData(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
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

  const houses = await prisma.house.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const categories = await prisma.taskCategory.findMany({
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return { task, houses, categories, users };
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "HIGH":
      return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
    case "MEDIUM":
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
    case "LOW":
      return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-purple-100 text-purple-800">In Progress</Badge>;
    case "COMPLETED":
      return <Badge className="bg-yellow-100 text-yellow-800">Completed - Awaiting Approval</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "INCOMPLETE":
      return <Badge className="bg-orange-100 text-orange-800">Incomplete</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatRoles(rolesJson: string) {
  try {
    const roles = JSON.parse(rolesJson);
    return roles
      .map((r: string) => {
        switch (r) {
          case "ADMIN":
            return "Admin";
          case "DESIGNATED_MANAGER":
            return "Designated Manager (DM)";
          case "DESIGNATED_COORDINATOR":
            return "Designated Coordinator (DC)";
          case "OPERATIONS":
            return "Operations";
          case "HR":
            return "Human Resources (HR)";
          case "FINANCE":
            return "Finance";
          case "DSP":
            return "DSP (DSP)";
          default:
            return r;
        }
      })
      .join(", ");
  } catch {
    return rolesJson;
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { task, houses, categories, users } = await getTaskData(id);

  if (!task) {
    notFound();
  }

  const isOverdue = (task.status === "PENDING" || task.status === "IN_PROGRESS") && new Date(task.dueDate) < new Date();
  // Only creator and admin can edit task details
  const isCreator = task.createdBy.id === session.id;
  const isAdmin = session.role === "ADMIN";
  const canEdit = (isCreator || isAdmin) && task.status !== "APPROVED";
  const canApprove = session.role === "ADMIN" && task.status === "COMPLETED";
  const canUpdateStatus = session.role !== "DSP" && (task.status === "PENDING" || task.status === "IN_PROGRESS");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
          <p className="text-slate-500">Task Details</p>
        </div>
        <TaskActions
          task={task}
          userRole={session.role}
          canUpdateStatus={canUpdateStatus}
          canApprove={canApprove}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Task Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Task Overview</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Category</h4>
                  {task.category ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.category.color }}
                      />
                      <span>{task.category.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">No category</span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Assigned To</h4>
                  {task.assignedUsers && task.assignedUsers.length > 0 ? (
                    <div className="space-y-1">
                      {task.assignedUsers.map((au) => (
                        <p key={au.user.id}>{au.user.name}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">No one assigned</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Due Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                      {format(new Date(task.dueDate), "MMMM d, yyyy")}
                    </span>
                    {isOverdue && (
                      <Badge className="bg-red-100 text-red-800 ml-2">Overdue</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">House</h4>
                  {task.house ? (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-400" />
                      <Link
                        href={`/dashboard/houses/${task.house.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {task.house.name}
                      </Link>
                    </div>
                  ) : (
                    <span className="text-slate-400">General (No specific house)</span>
                  )}
                </div>
              </div>

              {task.isRecurring && task.recurringType && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Recurring</h4>
                  <Badge variant="outline">
                    {task.recurringType.charAt(0) + task.recurringType.slice(1).toLowerCase()}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Task Created</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    <p className="text-sm text-slate-500">
                      by {task.createdBy.name}
                    </p>
                  </div>
                </div>

                {/* Completed or Incomplete */}
                {(task.status === "COMPLETED" || task.status === "APPROVED" || task.status === "INCOMPLETE") && task.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      task.status === "INCOMPLETE" ? "bg-orange-100" : "bg-yellow-100"
                    }`}>
                      {task.status === "INCOMPLETE" ? (
                        <XCircle className="h-4 w-4 text-orange-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {task.status === "INCOMPLETE" ? "Marked Incomplete" : "Marked Complete"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {task.completedBy && (
                        <p className="text-sm text-slate-500">
                          by {task.completedBy.name}
                        </p>
                      )}
                      {task.completedNote && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700">Note:</p>
                          <p className="text-sm text-slate-600">{task.completedNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approved */}
                {task.status === "APPROVED" && task.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(task.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {task.approvedBy && (
                        <p className="text-sm text-slate-500">
                          by {task.approvedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending - show what's next */}
                {task.status === "PENDING" && (
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isOverdue ? "bg-red-100" : "bg-slate-100"
                    }`}>
                      {isOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                        {isOverdue ? "Overdue - Awaiting Completion" : "Awaiting Completion"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}

                {/* In Progress */}
                {task.status === "IN_PROGRESS" && (
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isOverdue ? "bg-red-100" : "bg-purple-100"
                    }`}>
                      {isOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isOverdue ? "text-red-600" : "text-purple-600"}`}>
                        {isOverdue ? "Overdue - In Progress" : "In Progress"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}

                {task.status === "COMPLETED" && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-500">Awaiting Admin Approval</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Form (if allowed) */}
          {canEdit && (
            <EditTaskForm
              task={task}
              houses={houses}
              categories={categories}
              users={users}
            />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                {getStatusBadge(task.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority</span>
                {getPriorityBadge(task.priority)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Month/Year</span>
                <span>{task.month}/{task.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created</span>
                <span>{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Created by</p>
                  <p className="font-medium">{task.createdBy.name}</p>
                </div>
              </div>
              {task.completedBy && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-slate-500">Completed by</p>
                    <p className="font-medium">{task.completedBy.name}</p>
                  </div>
                </div>
              )}
              {task.approvedBy && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-slate-500">Approved by</p>
                    <p className="font-medium">{task.approvedBy.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card for Admin */}
          {canApprove && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-800">Approval Required</CardTitle>
                <CardDescription className="text-green-700">
                  This task is completed and awaiting your approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskActions
                  task={task}
                  userRole={session.role}
                  canUpdateStatus={false}
                  canApprove={true}
                  showApproveOnly
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
