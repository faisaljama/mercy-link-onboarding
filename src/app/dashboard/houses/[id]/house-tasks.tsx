"use client";

import { useEffect, useState } from "react";
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
import { Calendar, ExternalLink, CheckCircle2, Clock, Shield, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string;
  category: { id: string; name: string; color: string } | null;
}

interface HouseTasksProps {
  houseId: string;
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
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-green-100 text-green-800">
          <Shield className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case "INCOMPLETE":
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <XCircle className="mr-1 h-3 w-3" />
          Incomplete
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function HouseTasks({ houseId }: HouseTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const response = await fetch(
          `/api/tasks?houseId=${houseId}&month=${month}&year=${year}`
        );
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [houseId]);

  const isOverdue = (task: Task) => {
    return task.status === "PENDING" && new Date(task.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <p>No tasks for this house this month</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={`/dashboard/tasks?houseId=${houseId}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View All Tasks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.slice(0, 5).map((task) => (
            <TableRow key={task.id} className={isOverdue(task) ? "bg-red-50" : ""}>
              <TableCell>
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
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tasks.length > 5 && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/tasks?houseId=${houseId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View All {tasks.length} Tasks
            </Link>
          </Button>
        </div>
      )}

      {tasks.length <= 5 && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/tasks?houseId=${houseId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Tasks
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
