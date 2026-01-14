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
import { Plus, Loader2 } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface NewPaymentDialogProps {
  houses: House[];
}

export function NewPaymentDialog({ houses }: NewPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentNumber: "",
    paymentType: "EFT",
    paymentDate: new Date().toISOString().split("T")[0],
    paidCustomizedLiving: "",
    paidPCA: "",
    paidICS: "",
    paidOther: "",
    houseId: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          houseId: formData.houseId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      setOpen(false);
      setFormData({
        paymentNumber: "",
        paymentType: "EFT",
        paymentDate: new Date().toISOString().split("T")[0],
        paidCustomizedLiving: "",
        paidPCA: "",
        paidICS: "",
        paidOther: "",
        houseId: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(error instanceof Error ? error.message : "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return (
      (parseFloat(formData.paidCustomizedLiving) || 0) +
      (parseFloat(formData.paidPCA) || 0) +
      (parseFloat(formData.paidICS) || 0) +
      (parseFloat(formData.paidOther) || 0)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a new payment received from MHCP or insurance
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentNumber">Check/EFT #</Label>
                <Input
                  id="paymentNumber"
                  value={formData.paymentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentNumber: e.target.value })
                  }
                  placeholder="e.g., 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFT">EFT</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseId">House (Optional)</Label>
                <Select
                  value={formData.houseId || "all"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, houseId: value === "all" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Houses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Houses</SelectItem>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Payment Amounts by Service</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paidCustomizedLiving">Customized Living (CRS)</Label>
                <Input
                  id="paidCustomizedLiving"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidCustomizedLiving}
                  onChange={(e) =>
                    setFormData({ ...formData, paidCustomizedLiving: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidPCA">PCA</Label>
                <Input
                  id="paidPCA"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidPCA}
                  onChange={(e) =>
                    setFormData({ ...formData, paidPCA: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paidICS">ICS</Label>
                <Input
                  id="paidICS"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidICS}
                  onChange={(e) =>
                    setFormData({ ...formData, paidICS: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidOther">Other</Label>
                <Input
                  id="paidOther"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidOther}
                  onChange={(e) =>
                    setFormData({ ...formData, paidOther: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Payment:</span>
                <span className="text-xl font-bold text-green-600">
                  ${calculateTotal().toFixed(2)}
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
                placeholder="Optional notes about this payment"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || calculateTotal() === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
