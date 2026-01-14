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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2 } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  paymentNumber: string | null;
  paymentDate: string;
  totalAmount: unknown;
}

interface NewReconciliationDialogProps {
  houses: House[];
  payments: Payment[];
}

export function NewReconciliationDialog({ houses, payments }: NewReconciliationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    houseId: "",
    periodStart: "",
    periodEnd: "",
    serviceType: "CRS",
    billedUnits: "",
    billedAmount: "",
    paidAmount: "",
    paymentReceiptId: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/billing/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentReceiptId: formData.paymentReceiptId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create reconciliation");
      }

      setOpen(false);
      setFormData({
        houseId: "",
        periodStart: "",
        periodEnd: "",
        serviceType: "CRS",
        billedUnits: "",
        billedAmount: "",
        paidAmount: "",
        paymentReceiptId: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Error creating reconciliation:", error);
      alert(error instanceof Error ? error.message : "Failed to create reconciliation");
    } finally {
      setLoading(false);
    }
  };

  const calculatePending = () => {
    const billed = parseFloat(formData.billedAmount) || 0;
    const paid = parseFloat(formData.paidAmount) || 0;
    return Math.max(0, billed - paid);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Add Period
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Period Reconciliation</DialogTitle>
            <DialogDescription>
              Track billing vs payments for a billing period
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="houseId">House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, houseId: value })
                  }
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
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, serviceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRS">CRS</SelectItem>
                    <SelectItem value="ICS">ICS</SelectItem>
                    <SelectItem value="IHS">IHS</SelectItem>
                    <SelectItem value="PCA">PCA</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) =>
                    setFormData({ ...formData, periodStart: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, periodEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Billing Details</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billedUnits">Units/Days Billed</Label>
                <Input
                  id="billedUnits"
                  type="number"
                  min="0"
                  value={formData.billedUnits}
                  onChange={(e) =>
                    setFormData({ ...formData, billedUnits: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billedAmount">Billed Amount *</Label>
                <Input
                  id="billedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.billedAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, billedAmount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paidAmount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReceiptId">Link to Payment</Label>
                <Select
                  value={formData.paymentReceiptId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentReceiptId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No payment linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No payment linked</SelectItem>
                    {payments.map((payment) => (
                      <SelectItem key={payment.id} value={payment.id}>
                        {payment.paymentNumber || "Payment"} -{" "}
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Pending Amount:</span>
                <span className={`text-xl font-bold ${calculatePending() > 0 ? "text-orange-600" : "text-green-600"}`}>
                  ${calculatePending().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.houseId || !formData.periodStart || !formData.periodEnd || !formData.billedAmount}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Period
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
