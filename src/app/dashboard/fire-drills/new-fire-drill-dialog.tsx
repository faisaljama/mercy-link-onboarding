"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Flame } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  house: {
    id: string;
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export function NewFireDrillDialog({
  houses,
  clients,
  employees,
}: {
  houses: House[];
  clients: Client[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    houseId: "",
    drillDate: new Date().toISOString().split("T")[0],
    drillTime: new Date().toTimeString().slice(0, 5),
    summary: "",
  });

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Filter clients by selected house
  const filteredClients = formData.houseId
    ? clients.filter((c) => c.house.id === formData.houseId)
    : [];

  const toggleParticipant = (name: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const selectAllParticipants = () => {
    const allNames = filteredClients.map((c) => `${c.firstName} ${c.lastName}`);
    setSelectedParticipants(allNames);
  };

  const clearParticipants = () => {
    setSelectedParticipants([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fire-drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          participants: selectedParticipants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create fire drill");
      }

      const data = await res.json();
      setOpen(false);
      router.push(`/dashboard/fire-drills/${data.drill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fire drill");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      houseId: "",
      drillDate: new Date().toISOString().split("T")[0],
      drillTime: new Date().toTimeString().slice(0, 5),
      summary: "",
    });
    setSelectedParticipants([]);
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Fire Drill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Record Fire Drill
            </DialogTitle>
            <DialogDescription>
              Log a fire drill for a house. Fire drills are required every 2 months.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* House Selection */}
            <div className="space-y-2">
              <Label htmlFor="houseId">House *</Label>
              <Select
                value={formData.houseId}
                onValueChange={(value) => {
                  setFormData({ ...formData, houseId: value });
                  setSelectedParticipants([]);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
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

            {/* Date and Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="drillDate">Drill Date *</Label>
                <Input
                  id="drillDate"
                  type="date"
                  value={formData.drillDate}
                  onChange={(e) =>
                    setFormData({ ...formData, drillDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drillTime">Drill Time *</Label>
                <Input
                  id="drillTime"
                  type="time"
                  value={formData.drillTime}
                  onChange={(e) =>
                    setFormData({ ...formData, drillTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Participants */}
            {formData.houseId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Participants ({selectedParticipants.length} selected)</Label>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllParticipants}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearParticipants}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No active clients in this house
                  </p>
                ) : (
                  <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                    {filteredClients.map((client) => {
                      const fullName = `${client.firstName} ${client.lastName}`;
                      return (
                        <div
                          key={client.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`participant-${client.id}`}
                            checked={selectedParticipants.includes(fullName)}
                            onCheckedChange={() => toggleParticipant(fullName)}
                          />
                          <label
                            htmlFor={`participant-${client.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {fullName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary/Analysis/Recommendations */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary / Analysis / Recommendations</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Enter observations, analysis, and any recommendations from the fire drill..."
                rows={4}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.houseId}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Fire Drill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
