"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Shield,
  Trash2,
  PlayCircle,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskActionsProps {
  task: Task;
  userRole: string;
  canUpdateStatus: boolean;
  canApprove: boolean;
  showApproveOnly?: boolean;
}

export function TaskActions({
  task,
  userRole,
  canUpdateStatus,
  canApprove,
  showApproveOnly = false,
}: TaskActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);
  const [incompleteNote, setIncompleteNote] = useState("");

  const handleStartProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to start task");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error starting task:", error);
      alert("Failed to start task");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
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
      setLoading(false);
    }
  };

  const handleIncomplete = async () => {
    if (!incompleteNote.trim()) {
      alert("Please provide a note explaining why the task is incomplete");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
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
      setIncompleteNote("");
      router.refresh();
    } catch (error) {
      console.error("Error marking task incomplete:", error);
      alert("Failed to mark task as incomplete");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/approve`, {
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
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete task");
        return;
      }

      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  // Show only approve button
  if (showApproveOnly && canApprove) {
    return (
      <Button onClick={handleApprove} disabled={loading} className="w-full">
        <Shield className="mr-2 h-4 w-4" />
        {loading ? "Approving..." : "Approve Task"}
      </Button>
    );
  }

  const canDelete = userRole === "ADMIN" && task.status !== "APPROVED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={loading}>
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdateStatus && task.status === "PENDING" && (
            <>
              <DropdownMenuItem onClick={handleStartProgress}>
                <PlayCircle className="mr-2 h-4 w-4 text-purple-600" />
                Start Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIncompleteDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                Mark Incomplete
              </DropdownMenuItem>
            </>
          )}

          {canUpdateStatus && task.status === "IN_PROGRESS" && (
            <>
              <DropdownMenuItem onClick={handleComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIncompleteDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                Mark Incomplete
              </DropdownMenuItem>
            </>
          )}

          {canApprove && (
            <DropdownMenuItem onClick={handleApprove}>
              <Shield className="mr-2 h-4 w-4 text-blue-600" />
              Approve
            </DropdownMenuItem>
          )}

          {canDelete && (
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
                  setIncompleteNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIncomplete}
                disabled={!incompleteNote.trim() || loading}
              >
                {loading ? "Saving..." : "Mark Incomplete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
