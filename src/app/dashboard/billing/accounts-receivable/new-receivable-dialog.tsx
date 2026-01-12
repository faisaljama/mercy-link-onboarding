"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2 } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  houseId: string;
  serviceAgreements: {
    dailyRate: string | number | null;
  }[];
}

// Bi-weekly period helper
const PERIOD_DAYS = 14;

// Generate list of bi-weekly periods for dropdown selection
// Periods: 12/26/25-1/8/26, 1/9/26-1/22/26, 1/23/26-2/5/26, etc.
function generateBiWeeklyPeriods() {
  const periods: { startDate: string; endDate: string; label: string }[] = [];
  const anchor = new Date("2025-12-26T00:00:00");

  // Generate 28 periods to cover all of 2026
  const totalPeriods = 28;

  for (let i = 0; i < totalPeriods; i++) {
    const periodStart = new Date(anchor);
    periodStart.setDate(anchor.getDate() + i * PERIOD_DAYS);

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + PERIOD_DAYS - 1);

    const formatDate = (d: Date) => {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
    };

    periods.push({
      startDate: periodStart.toISOString().split("T")[0],
      endDate: periodEnd.toISOString().split("T")[0],
      label: `${formatDate(periodStart)} - ${formatDate(periodEnd)}`,
    });
  }

  return periods;
}

const REASONS = [
  { value: "MISSING_SERVICE_AGREEMENT", label: "Missing Service Agreement" },
  { value: "SERVICE_AGREEMENT_EXPIRED", label: "Service Agreement Expired" },
  { value: "SERVICE_AGREEMENT_ISSUE", label: "Service Agreement Issue" },
  { value: "INSURANCE_ISSUE", label: "Insurance Issue" },
  { value: "OTHER", label: "Other" },
];

export function NewReceivableDialog({
  houses,
  clients,
}: {
  houses: House[];
  clients: Client[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const periods = generateBiWeeklyPeriods();

  const [formData, setFormData] = useState({
    houseId: "",
    clientName: "",
    period: "",
    daysUnbilled: "",
    dailyRate: "",
    reason: "",
    reasonNotes: "",
  });

  // Filter clients by selected house
  const filteredClients = formData.houseId
    ? clients.filter((c) => c.houseId === formData.houseId)
    : [];

  const handleClientSelect = (clientName: string) => {
    const client = clients.find(
      (c) => `${c.firstName} ${c.lastName}` === clientName
    );
    if (client) {
      const dailyRate = client.serviceAgreements[0]?.dailyRate;
      setFormData({
        ...formData,
        clientName,
        dailyRate: dailyRate ? String(dailyRate) : "",
      });
    } else {
      setFormData({ ...formData, clientName });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const [periodStart, periodEnd] = formData.period.split("|");

      const res = await fetch("/api/accounts-receivable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: formData.houseId,
          clientName: formData.clientName,
          periodStart,
          periodEnd,
          daysUnbilled: parseInt(formData.daysUnbilled) || 0,
          dailyRate: parseFloat(formData.dailyRate) || null,
          reason: formData.reason,
          reasonNotes: formData.reasonNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create entry");
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      houseId: "",
      clientName: "",
      period: "",
      daysUnbilled: "",
      dailyRate: "",
      reason: "",
      reasonNotes: "",
    });
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
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Accounts Receivable Entry</DialogTitle>
            <DialogDescription>
              Track unbilled amounts for a client
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="houseId">House *</Label>
              <Select
                value={formData.houseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, houseId: value, clientName: "" })
                }
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

            <div className="space-y-2">
              <Label htmlFor="clientName">Client *</Label>
              <Select
                value={formData.clientName}
                onValueChange={handleClientSelect}
                disabled={!formData.houseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={`${client.firstName} ${client.lastName}`}
                    >
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Billing Period *</Label>
              <Select
                value={formData.period}
                onValueChange={(value) =>
                  setFormData({ ...formData, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem
                      key={`${period.startDate}|${period.endDate}`}
                      value={`${period.startDate}|${period.endDate}`}
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daysUnbilled">Days Unbilled *</Label>
                <Input
                  id="daysUnbilled"
                  type="number"
                  min="0"
                  max="14"
                  value={formData.daysUnbilled}
                  onChange={(e) =>
                    setFormData({ ...formData, daysUnbilled: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dailyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyRate: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) =>
                  setFormData({ ...formData, reason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonNotes">Notes</Label>
              <Textarea
                id="reasonNotes"
                value={formData.reasonNotes}
                onChange={(e) =>
                  setFormData({ ...formData, reasonNotes: e.target.value })
                }
                placeholder="Additional details about the issue..."
                rows={2}
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
              disabled={
                loading ||
                !formData.houseId ||
                !formData.clientName ||
                !formData.period ||
                !formData.reason
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
