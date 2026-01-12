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
import { Plus, Loader2, Trash2 } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface BillingEntry {
  houseName: string;
  clientName: string;
  totalClaims: string;
  totalCharges: string;
  entryStatus: string;
  insuranceProvider: string;
}

const MHCP_BILLING_CYCLES_2026 = [
  { cycle: 1, cutOff: "January 15, 2026", eftPayment: "January 20, 2026" },
  { cycle: 2, cutOff: "January 29, 2026", eftPayment: "February 03, 2026" },
  { cycle: 3, cutOff: "February 12, 2026", eftPayment: "February 17, 2026" },
  { cycle: 4, cutOff: "February 26, 2026", eftPayment: "March 03, 2026" },
  { cycle: 5, cutOff: "March 12, 2026", eftPayment: "March 17, 2026" },
  { cycle: 6, cutOff: "March 26, 2026", eftPayment: "March 31, 2026" },
  { cycle: 7, cutOff: "April 09, 2026", eftPayment: "April 14, 2026" },
  { cycle: 8, cutOff: "April 23, 2026", eftPayment: "April 28, 2026" },
  { cycle: 9, cutOff: "May 07, 2026", eftPayment: "May 12, 2026" },
  { cycle: 10, cutOff: "May 21, 2026", eftPayment: "May 26, 2026" },
  { cycle: 11, cutOff: "June 04, 2026", eftPayment: "June 09, 2026" },
  { cycle: 12, cutOff: "June 18, 2026", eftPayment: "June 23, 2026" },
  { cycle: 13, cutOff: "July 02, 2026", eftPayment: "July 07, 2026" },
  { cycle: 14, cutOff: "July 16, 2026", eftPayment: "July 21, 2026" },
  { cycle: 15, cutOff: "July 30, 2026", eftPayment: "August 04, 2026" },
  { cycle: 16, cutOff: "August 13, 2026", eftPayment: "August 18, 2026" },
  { cycle: 17, cutOff: "August 27, 2026", eftPayment: "September 01, 2026" },
  { cycle: 18, cutOff: "September 10, 2026", eftPayment: "September 15, 2026" },
  { cycle: 19, cutOff: "September 24, 2026", eftPayment: "September 29, 2026" },
  { cycle: 20, cutOff: "October 08, 2026", eftPayment: "October 13, 2026" },
  { cycle: 21, cutOff: "October 22, 2026", eftPayment: "October 27, 2026" },
  { cycle: 22, cutOff: "November 05, 2026", eftPayment: "November 10, 2026" },
  { cycle: 23, cutOff: "November 19, 2026", eftPayment: "November 24, 2026" },
  { cycle: 24, cutOff: "December 03, 2026", eftPayment: "December 08, 2026" },
  { cycle: 25, cutOff: "December 17, 2026", eftPayment: "December 22, 2026" },
  { cycle: 26, cutOff: "December 31, 2026", eftPayment: "January 05, 2027" },
];

const ENTRY_STATUSES = [
  { value: "Billed", label: "Billed" },
  { value: "No SA", label: "No SA (No Service Agreement)" },
  { value: "No attendance", label: "No Attendance" },
];

export function NewBillingReportDialog({ houses }: { houses: House[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    serviceDateStart: "",
    serviceDateEnd: "",
    dateProcessed: new Date().toISOString().split("T")[0],
    billingCycle: "",
    notes: "",
  });

  const [entries, setEntries] = useState<BillingEntry[]>([
    {
      houseName: "",
      clientName: "",
      totalClaims: "1",
      totalCharges: "",
      entryStatus: "Billed",
      insuranceProvider: "",
    },
  ]);

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        houseName: entries[entries.length - 1]?.houseName || "",
        clientName: "",
        totalClaims: "1",
        totalCharges: "",
        entryStatus: "Billed",
        insuranceProvider: "",
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof BillingEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const calculateTotal = () => {
    return entries.reduce((sum, e) => sum + (parseFloat(e.totalCharges) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          billingCycle: formData.billingCycle ? parseInt(formData.billingCycle) : null,
          entries: entries.filter((e) => e.houseName && (e.totalCharges || e.entryStatus)),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create billing report");
      }

      const data = await res.json();
      setOpen(false);
      router.push(`/dashboard/billing/reports/${data.report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create billing report");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceDateStart: "",
      serviceDateEnd: "",
      dateProcessed: new Date().toISOString().split("T")[0],
      billingCycle: "",
      notes: "",
    });
    setEntries([
      {
        houseName: "",
        clientName: "",
        totalClaims: "1",
        totalCharges: "",
        entryStatus: "Billed",
        insuranceProvider: "",
      },
    ]);
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
          New Billing Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Billing Report</DialogTitle>
            <DialogDescription>
              Enter billing information after processing claims in MN-ITS
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Service Period */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="serviceDateStart">Service Date Start *</Label>
                <Input
                  id="serviceDateStart"
                  type="date"
                  value={formData.serviceDateStart}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceDateStart: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDateEnd">Service Date End *</Label>
                <Input
                  id="serviceDateEnd"
                  type="date"
                  value={formData.serviceDateEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceDateEnd: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateProcessed">Date Processed *</Label>
                <Input
                  id="dateProcessed"
                  type="date"
                  value={formData.dateProcessed}
                  onChange={(e) =>
                    setFormData({ ...formData, dateProcessed: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label htmlFor="billingCycle">MHCP Billing Cycle</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value) =>
                  setFormData({ ...formData, billingCycle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {MHCP_BILLING_CYCLES_2026.map((cycle) => (
                    <SelectItem key={cycle.cycle} value={String(cycle.cycle)}>
                      Cycle {cycle.cycle} - Cut-off: {cycle.cutOff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.billingCycle && (
                <p className="text-xs text-slate-500">
                  EFT Payment:{" "}
                  {
                    MHCP_BILLING_CYCLES_2026.find(
                      (c) => c.cycle === parseInt(formData.billingCycle)
                    )?.eftPayment
                  }
                </p>
              )}
            </div>

            {/* Billing Entries */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Billing Entries</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Row
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">House *</th>
                      <th className="px-3 py-2 text-left font-medium">Client</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-right font-medium">Claims</th>
                      <th className="px-3 py-2 text-right font-medium">Charges ($)</th>
                      <th className="px-3 py-2 text-left font-medium">Insurance</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-1">
                          <Select
                            value={entry.houseName}
                            onValueChange={(value) =>
                              updateEntry(index, "houseName", value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="House" />
                            </SelectTrigger>
                            <SelectContent>
                              {houses.map((house) => (
                                <SelectItem key={house.id} value={house.name}>
                                  {house.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Client name"
                            value={entry.clientName}
                            onChange={(e) =>
                              updateEntry(index, "clientName", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Select
                            value={entry.entryStatus}
                            onValueChange={(value) =>
                              updateEntry(index, "entryStatus", value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Billed" />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTRY_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 text-xs w-16 text-right"
                            type="number"
                            min="0"
                            value={entry.totalClaims}
                            onChange={(e) =>
                              updateEntry(index, "totalClaims", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 text-xs w-24 text-right"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={entry.totalCharges}
                            onChange={(e) =>
                              updateEntry(index, "totalCharges", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Insurance"
                            value={entry.insuranceProvider}
                            onChange={(e) =>
                              updateEntry(index, "insuranceProvider", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          {entries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => removeEntry(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-bold">
                        Total:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-green-600">
                        ${calculateTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this billing report..."
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
                !formData.serviceDateStart ||
                !formData.serviceDateEnd ||
                !formData.dateProcessed ||
                entries.every((e) => !e.houseName)
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
