"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Shield,
  Trash2,
  Calendar,
  Home,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  role: string;
}

interface TaskAssignment {
  user: User;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | string;
  assignedRoles: string;
  assignedUsers?: TaskAssignment[];
  completedNote: string | null;
  category: { id: string; name: string; color: string } | null;
  house: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  completedBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
}

interface TaskTableProps {
  tasks: Task[];
  userRole: string;
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "HIGH":
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    case "MEDIUM":
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    case "LOW":
      return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    case "COMPLETED":
      return <Badge className="bg-yellow-100 text-yellow-800">Completed</Badge>;
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
            return "DM";
          case "DESIGNATED_COORDINATOR":
            return "DC";
          case "OPERATIONS":
            return "Ops";
          case "HR":
            return "HR";
          case "FINANCE":
            return "Finance";
          case "LEAD_STAFF":
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

export function TaskTable({ tasks, userRole }: TaskTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [incompleteNote, setIncompleteNote] = useState("");

  const canEdit = userRole !== "LEAD_STAFF";
  const canApprove = userRole === "ADMIN";
  const canDelete = userRole === "ADMIN";

  const handleComplete = async (taskId: string) => {
    setLoading(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to complete task");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to complete task");
    } finally {
      setLoading(null);
    }
  };

  const handleIncomplete = async () => {
    if (!selectedTaskId || !incompleteNote.trim()) {
      alert("Please provide a note explaining why the task is incomplete");
      return;
    }

    setLoading(selectedTaskId);
    try {
      const response = await fetch(`/api/tasks/${selectedTaskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INCOMPLETE", note: incompleteNote }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to mark task as incomplete");
        return;
      }

      setIncompleteDialogOpen(false);
      setSelectedTaskId(null);
      setIncompleteNote("");
      router.refresh();
    } catch (error) {
      console.error("Error marking task incomplete:", error);
      alert("Failed to mark task as incomplete");
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async (taskId: string) => {
    setLoading(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to approve task");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error approving task:", error);
      alert("Failed to approve task");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete task");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    } finally {
      setLoading(null);
    }
  };

  const isOverdue = (task: Task) => {
    return task.status === "PENDING" && new Date(task.dueDate) < new Date();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className={isOverdue(task) ? "bg-red-50" : ""}>
              <TableCell>
                <div>
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {task.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {task.category ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.category.color }}
                    />
                    <span className="text-sm">{task.category.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">None</span>
                )}
              </TableCell>
              <TableCell>{getPriorityBadge(task.priority)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className={isOverdue(task) ? "text-red-600 font-medium" : ""}>
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {task.house ? (
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{task.house.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">General</span>
                )}
              </TableCell>
              <TableCell>
                {task.assignedUsers && task.assignedUsers.length > 0 ? (
                  <span className="text-sm">
                    {task.assignedUsers.map(au => au.user.name).join(", ")}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">Unassigned</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loading === task.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/tasks/${task.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>

                    {canEdit && task.status === "PENDING" && (
                      <>
                        <DropdownMenuItem onClick={() => handleComplete(task.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIncompleteDialogOpen(true);
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                          Mark Incomplete
                        </DropdownMenuItem>
                      </>
                    )}

                    {canApprove && task.status === "COMPLETED" && (
                      <DropdownMenuItem onClick={() => handleApprove(task.id)}>
                        <Shield className="mr-2 h-4 w-4 text-blue-600" />
                        Approve
                      </DropdownMenuItem>
                    )}

                    {canDelete && task.status !== "APPROVED" && (
                      <DropdownMenuItem
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Incomplete Note Dialog */}
      <Dialog open={incompleteDialogOpen} onOpenChange={setIncompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Task as Incomplete</DialogTitle>
            <DialogDescription>
              Please provide a note explaining why this task could not be completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incompleteNote">Note *</Label>
              <Textarea
                id="incompleteNote"
                value={incompleteNote}
                onChange={(e) => setIncompleteNote(e.target.value)}
                placeholder="Explain why this task is incomplete..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIncompleteDialogOpen(false);
                  setSelectedTaskId(null);
                  setIncompleteNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIncomplete}
                disabled={!incompleteNote.trim() || loading === selectedTaskId}
              >
                {loading === selectedTaskId ? "Saving..." : "Mark Incomplete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
