"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface House {
  id: string;
  name: string;
}

export function NewReportDialog({ houses }: { houses: House[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [houseId, setHouseId] = useState("");
  const [weekOf, setWeekOf] = useState(format(new Date(), "yyyy-MM-dd"));
  const router = useRouter();

  // Calculate week range for display
  const selectedDate = new Date(weekOf);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseId || !weekOf) return;

    setLoading(true);
    try {
      const response = await fetch("/api/weekly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId,
          weekOf,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create report");
        return;
      }

      const report = await response.json();
      setOpen(false);
      router.push(`/dashboard/weekly-reports/${report.id}`);
      router.refresh();
    } catch {
      alert("Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Weekly DC Report</DialogTitle>
          <DialogDescription>
            Create a new weekly report for DM submission.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="house">House</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select house..." />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weekOf">Week Of (select any day in the week)</Label>
              <Input
                id="weekOf"
                type="date"
                value={weekOf}
                onChange={(e) => setWeekOf(e.target.value)}
              />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>
                  Week: {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !houseId}>
              {loading ? "Creating..." : "Create Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
