import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { PrintActions } from "./print-actions";

interface SearchParams {
  month?: string;
  year?: string;
  status?: string;
  categoryId?: string;
  houseId?: string;
  priority?: string;
}

async function getTasksForPrint(
  houseIds: string[],
  searchParams: SearchParams
) {
  const now = new Date();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

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

  return { tasks, month, year };
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
            return "DM";
          case "DESIGNATED_COORDINATOR":
            return "DC";
          case "OPERATIONS":
            return "Ops";
          case "HR":
            return "HR";
          case "FINANCE":
            return "Finance";
          case "DSP":
            return "DSP";
          default:
            return r;
        }
      })
      .join(", ");
  } catch {
    return rolesJson;
  }
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function TasksPrintPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { tasks, month, year } = await getTasksForPrint(houseIds, params);

  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const approved = tasks.filter((t) => t.status === "APPROVED").length;
  const incomplete = tasks.filter((t) => t.status === "INCOMPLETE").length;

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <PrintActions />

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4">
        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Mercy Link Staff Tasks</h1>
          <p className="text-lg text-slate-600">{MONTHS[month - 1]} {year}</p>
          <p className="text-sm text-slate-500 mt-1">
            Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8 print:mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg print:border print:bg-white">
            <p className="text-2xl font-bold text-blue-600">{pending}</p>
            <p className="text-xs text-slate-600">Pending</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg print:border print:bg-white">
            <p className="text-2xl font-bold text-yellow-600">{completed}</p>
            <p className="text-xs text-slate-600">Completed</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg print:border print:bg-white">
            <p className="text-2xl font-bold text-green-600">{approved}</p>
            <p className="text-xs text-slate-600">Approved</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg print:border print:bg-white">
            <p className="text-2xl font-bold text-orange-600">{incomplete}</p>
            <p className="text-xs text-slate-600">Incomplete</p>
          </div>
        </div>

        {/* Tasks Table */}
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No tasks for this period
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-2 px-2">Task</th>
                <th className="text-left py-2 px-2">Category</th>
                <th className="text-left py-2 px-2">Priority</th>
                <th className="text-left py-2 px-2">Due Date</th>
                <th className="text-left py-2 px-2">House</th>
                <th className="text-left py-2 px-2">Assigned</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={`border-b border-slate-200 ${
                    index % 2 === 0 ? "bg-slate-50 print:bg-white" : ""
                  }`}
                >
                  <td className="py-2 px-2">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {task.category ? (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full print:border"
                          style={{ backgroundColor: task.category.color }}
                        />
                        {task.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-800 print:border print:bg-white"
                          : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800 print:border print:bg-white"
                          : "bg-green-100 text-green-800 print:border print:bg-white"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </td>
                  <td className="py-2 px-2">
                    {task.house?.name || "General"}
                  </td>
                  <td className="py-2 px-2">
                    {task.assignedUsers && task.assignedUsers.length > 0
                      ? task.assignedUsers.map((au: { user: { name: string } }) => au.user.name).join(", ")
                      : "Unassigned"}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        task.status === "PENDING"
                          ? "bg-blue-100 text-blue-800 print:border print:bg-white"
                          : task.status === "COMPLETED"
                          ? "bg-yellow-100 text-yellow-800 print:border print:bg-white"
                          : task.status === "APPROVED"
                          ? "bg-green-100 text-green-800 print:border print:bg-white"
                          : "bg-orange-100 text-orange-800 print:border print:bg-white"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-slate-500 print:mt-4">
          <p>Total Tasks: {tasks.length}</p>
          <p className="mt-1">Mercy Link 245D Compliance Dashboard</p>
        </div>
      </div>
    </div>
  );
}
