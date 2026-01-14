"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface House {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

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
  categoryId: string | null;
  priority: string;
  assignedRoles: string;
  assignedUsers?: TaskAssignment[];
  houseId: string | null;
  dueDate: Date | string;
  isRecurring: boolean;
  recurringType: string | null;
}

interface EditTaskFormProps {
  task: Task;
  houses: House[];
  categories: Category[];
  users: User[];
}

function formatRoleLabel(role: string): string {
  switch (role) {
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
      return role;
  }
}

export function EditTaskForm({ task, houses, categories, users }: EditTaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Get assigned user IDs from the task
  const initialUserIds: string[] = task.assignedUsers?.map(au => au.user.id) || [];

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    categoryId: task.categoryId || "",
    priority: task.priority,
    assignedUserIds: initialUserIds,
    houseId: task.houseId || "",
    dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
    isRecurring: task.isRecurring,
    recurringType: task.recurringType || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedUserIds: formData.assignedUserIds,
          houseId: formData.houseId || null,
          categoryId: formData.categoryId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to update task");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Task</CardTitle>
        <CardDescription>
          Update task details. Changes will take effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId || "none"}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="house">House (optional)</Label>
            <Select
              value={formData.houseId || "none"}
              onValueChange={(value) => setFormData({ ...formData, houseId: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select house (or leave empty for general task)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific house</SelectItem>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign to *</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-${user.id}`}
                    checked={formData.assignedUserIds.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <label htmlFor={`edit-${user.id}`} className="text-sm cursor-pointer">
                    {user.name} - {formatRoleLabel(user.role)}
                  </label>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-slate-500">No users available</p>
              )}
            </div>
            {formData.assignedUserIds.length === 0 && (
              <p className="text-sm text-red-500">Select at least one person</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecurring: checked as boolean })
              }
            />
            <label htmlFor="edit-isRecurring" className="text-sm cursor-pointer">
              Recurring task
            </label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurringType">Recurring Frequency</Label>
              <Select
                value={formData.recurringType}
                onValueChange={(value) => setFormData({ ...formData, recurringType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || formData.assignedUserIds.length === 0}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
