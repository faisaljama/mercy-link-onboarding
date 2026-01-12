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
import { Plus, Eye, MapPin } from "lucide-react";
import { format } from "date-fns";

interface House {
  id: string;
  name: string;
}

export function NewChecklistDialog({ houses }: { houses: House[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [houseId, setHouseId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [visitType, setVisitType] = useState<"REMOTE" | "ONSITE">("REMOTE");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseId || !date) return;

    setLoading(true);
    try {
      const response = await fetch("/api/dc-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId,
          date,
          visitType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create checklist");
        return;
      }

      const checklist = await response.json();
      setOpen(false);
      router.push(`/dashboard/dc-checklist/${checklist.id}`);
      router.refresh();
    } catch {
      alert("Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Checklist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New DC Daily Checklist</DialogTitle>
          <DialogDescription>
            Create a new daily checklist for remote oversight or onsite visit.
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Visit Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={visitType === "REMOTE" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setVisitType("REMOTE")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Remote
                </Button>
                <Button
                  type="button"
                  variant={visitType === "ONSITE" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setVisitType("ONSITE")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Onsite
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {visitType === "REMOTE"
                  ? "Remote oversight for daily documentation and medication review"
                  : "Onsite visit for facility inspection and staff interaction"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !houseId}>
              {loading ? "Creating..." : "Create Checklist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
