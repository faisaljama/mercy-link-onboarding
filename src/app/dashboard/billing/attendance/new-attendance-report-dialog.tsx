"use client";

import { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2, AlertTriangle } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  pmiNumber?: string | null;
  houseId: string;
  serviceAgreements: {
    dailyRate: string | number | null;
  }[];
}

interface BiWeeklyPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

interface AttendanceEntry {
  clientName: string;
  maId: string;
  dailyRate: string;
  notes: string;
  days: Record<string, string>;
}

const ATTENDANCE_CODES = [
  { value: "P", label: "Present", billable: true },
  { value: "A", label: "Absent", billable: false },
  { value: "H", label: "Hospitalized", billable: false },
  { value: "V", label: "Vacation", billable: false },
  { value: "DC", label: "Discharged", billable: false },
];

const BILLABLE_CODES = ["P"];

// Bi-weekly period anchor date: December 26, 2025
const ANCHOR_DATE = new Date("2025-12-26T00:00:00");
const PERIOD_DAYS = 14;

// Generate list of bi-weekly periods for dropdown selection
// Periods: 12/26/25-1/8/26, 1/9/26-1/22/26, 1/23/26-2/5/26, etc.
function generateBiWeeklyPeriods(): BiWeeklyPeriod[] {
  const periods: BiWeeklyPeriod[] = [];
  const anchor = new Date("2025-12-26T00:00:00");

  // Generate 28 periods to cover all of 2026 (14 days * 28 = 392 days)
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

// Get current period for default selection
function getCurrentPeriodKey(): string {
  const anchor = new Date("2025-12-26T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const periodIndex = Math.max(0, Math.floor(diffDays / PERIOD_DAYS));

  const periodStart = new Date(anchor);
  periodStart.setDate(anchor.getDate() + periodIndex * PERIOD_DAYS);

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + PERIOD_DAYS - 1);

  return `${periodStart.toISOString().split("T")[0]}|${periodEnd.toISOString().split("T")[0]}`;
}

// Get the day of the week for a date
function getDayOfWeek(dateStr: string, dayOffset: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}

// Get the date number for display
function getDateNumber(dateStr: string, dayOffset: number): number {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + dayOffset);
  return date.getDate();
}

export function NewAttendanceReportDialog({
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

  // Generate bi-weekly periods
  const periods = generateBiWeeklyPeriods();

  // Get current period for default selection
  const currentPeriodKey = getCurrentPeriodKey();

  const [formData, setFormData] = useState({
    houseId: "",
    period: currentPeriodKey,
    notes: "",
  });

  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [showHospitalDialog, setShowHospitalDialog] = useState(false);

  // Get selected period dates
  const [selectedStartDate, selectedEndDate] = formData.period.split("|");

  // When house changes, populate clients
  useEffect(() => {
    if (formData.houseId) {
      const houseClients = clients.filter((c) => c.houseId === formData.houseId);
      const newEntries = houseClients.map((client) => {
        const dailyRate = client.serviceAgreements[0]?.dailyRate;
        const rateValue = dailyRate ? Number(dailyRate) : 0;

        return {
          clientName: `${client.firstName} ${client.lastName}`,
          maId: client.pmiNumber || "",
          dailyRate: rateValue.toString(),
          notes: "",
          days: {},
        };
      });
      setEntries(newEntries);
    } else {
      setEntries([]);
    }
  }, [formData.houseId, clients]);

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        clientName: "",
        maId: "",
        dailyRate: "",
        notes: "",
        days: {},
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof AttendanceEntry, value: string | Record<string, string>) => {
    const updated = [...entries];
    if (field === "days") {
      updated[index] = { ...updated[index], days: value as Record<string, string> };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setEntries(updated);
  };

  const updateDayCode = (entryIndex: number, day: number, code: string) => {
    const updated = [...entries];
    updated[entryIndex] = {
      ...updated[entryIndex],
      days: {
        ...updated[entryIndex].days,
        [`day${day}`]: code,
      },
    };
    setEntries(updated);

    // Show hospitalization billing info dialog
    if (code === "H") {
      setShowHospitalDialog(true);
    }
  };

  const fillAllPresent = (entryIndex: number) => {
    const days: Record<string, string> = {};
    for (let day = 1; day <= PERIOD_DAYS; day++) {
      days[`day${day}`] = "P";
    }
    updateEntry(entryIndex, "days", days);
  };

  const calculateTotals = (entry: AttendanceEntry) => {
    let billable = 0;
    let nonBillable = 0;
    for (let day = 1; day <= PERIOD_DAYS; day++) {
      const code = entry.days[`day${day}`];
      if (code) {
        if (BILLABLE_CODES.includes(code)) {
          billable++;
        } else {
          nonBillable++;
        }
      }
    }
    return { billable, nonBillable };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/attendance-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: formData.houseId,
          startDate: selectedStartDate,
          endDate: selectedEndDate,
          entries: entries.filter((e) => e.clientName),
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create attendance report");
      }

      const data = await res.json();
      setOpen(false);
      router.push(`/dashboard/billing/attendance/${data.report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create attendance report");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      houseId: "",
      period: currentPeriodKey,
      notes: "",
    });
    setEntries([]);
    setError("");
  };

  return (
    <>
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
          New Attendance Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Bi-Weekly Attendance Report</DialogTitle>
            <DialogDescription>
              Track attendance for a 14-day billing period
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Report Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="houseId">House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, houseId: value })
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
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={addEntry}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </div>

            {/* Attendance Grid */}
            {formData.houseId && entries.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium sticky left-0 bg-slate-100 z-10 min-w-[150px]">
                        Resident Name
                      </th>
                      <th className="px-2 py-2 text-left font-medium min-w-[100px]">MA ID</th>
                      <th className="px-2 py-2 text-left font-medium min-w-[80px]">Actions</th>
                      {Array.from({ length: PERIOD_DAYS }, (_, i) => (
                        <th key={i + 1} className="px-1 py-2 text-center font-medium min-w-[40px]">
                          <div className="text-[10px] text-slate-500">
                            {getDayOfWeek(selectedStartDate, i)}
                          </div>
                          <div>{getDateNumber(selectedStartDate, i)}</div>
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center font-medium bg-green-100 min-w-[60px]">
                        Billable
                      </th>
                      <th className="px-2 py-2 text-center font-medium bg-red-100 min-w-[60px]">
                        Non-Bill
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, entryIndex) => {
                      const totals = calculateTotals(entry);
                      return (
                        <tr key={entryIndex} className="border-t">
                          <td className="px-2 py-1 sticky left-0 bg-white z-10">
                            <Input
                              className="h-7 text-xs"
                              placeholder="Client name"
                              value={entry.clientName}
                              onChange={(e) =>
                                updateEntry(entryIndex, "clientName", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              className="h-7 text-xs"
                              placeholder="MA ID"
                              value={entry.maId}
                              onChange={(e) =>
                                updateEntry(entryIndex, "maId", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-green-600"
                                onClick={() => fillAllPresent(entryIndex)}
                                title="Fill all days with P (Present)"
                              >
                                Fill P
                              </Button>
                              {entries.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500"
                                  onClick={() => removeEntry(entryIndex)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                          {Array.from({ length: PERIOD_DAYS }, (_, dayIndex) => {
                            const day = dayIndex + 1;
                            const code = entry.days[`day${day}`] || "";
                            const isPresent = code === "P";
                            return (
                              <td key={day} className="px-0 py-1">
                                <Select
                                  value={code || "empty"}
                                  onValueChange={(value) =>
                                    updateDayCode(entryIndex, day, value === "empty" ? "" : value)
                                  }
                                >
                                  <SelectTrigger
                                    className={`h-7 w-[38px] px-1 text-xs ${
                                      code
                                        ? isPresent
                                          ? "bg-green-100 border-green-400 text-green-800"
                                          : "bg-red-100 border-red-400 text-red-800"
                                        : ""
                                    }`}
                                  >
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="empty">-</SelectItem>
                                    {ATTENDANCE_CODES.map((ac) => (
                                      <SelectItem
                                        key={ac.value}
                                        value={ac.value}
                                        className={ac.billable ? "text-green-700" : "text-red-700"}
                                      >
                                        {ac.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            );
                          })}
                          <td className="px-2 py-1 text-center font-bold text-green-600 bg-green-50">
                            {totals.billable}
                          </td>
                          <td className="px-2 py-1 text-center font-bold text-red-600 bg-red-50">
                            {totals.nonBillable}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this attendance report..."
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
                !formData.period ||
                entries.length === 0 ||
                entries.every((e) => !e.clientName)
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      {/* Hospitalization Billing Info Dialog */}
      <AlertDialog open={showHospitalDialog} onOpenChange={setShowHospitalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Hospitalization Billing Notice
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                When a client is hospitalized, the following billing procedures apply:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>
                  <strong>Days 1-3:</strong> The facility may bill for bed-hold days if the client is expected to return.
                </li>
                <li>
                  <strong>After Day 3:</strong> Billing stops until the client returns to the facility.
                </li>
                <li>
                  <strong>Documentation Required:</strong> Hospital admission date, expected return date, and discharge summary must be obtained.
                </li>
                <li>
                  <strong>Notification:</strong> Case manager and county must be notified within 24 hours of hospitalization.
                </li>
              </ul>
              <p className="text-amber-600 font-medium">
                Please ensure all required documentation is collected and notifications are sent promptly.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
