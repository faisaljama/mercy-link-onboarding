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
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

interface GenerateTasksButtonProps {
  month: number;
  year: number;
}

export function GenerateTasksButton({ month, year }: GenerateTasksButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    tasksCreated: number;
    createdTasks: string[];
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to generate tasks");
        return;
      }

      setResult(data);
      router.refresh();
    } catch (error) {
      console.error("Error generating tasks:", error);
      alert("Failed to generate tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Auto-Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Recurring Tasks</DialogTitle>
          <DialogDescription>
            This will create new tasks based on recurring task templates for {month}/{year}.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Recurring tasks marked as Monthly, Quarterly, or Yearly will be checked and new
              instances will be created for the current viewing period if they don't already exist.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Tasks"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {result.tasksCreated === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-600">
                  No new recurring tasks to generate for this period.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Tasks may have already been generated or no recurring tasks are due.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-green-600 font-medium">
                  Successfully created {result.tasksCreated} task{result.tasksCreated > 1 ? "s" : ""}!
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {result.createdTasks.map((title, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
