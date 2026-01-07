"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Building2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  rentAmount: number | null;
  checkDeliveryLocation: string | null;
  houseId: string;
}

interface RentPayment {
  id: string;
  clientId: string;
  houseId: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  checkNumber: string | null;
  notes: string | null;
  enteredBy: { id: string; name: string };
  signedOffBy: { id: string; name: string } | null;
  signedOffAt: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    rentAmount: number | null;
    checkDeliveryLocation: string | null;
  };
  house: { id: string; name: string };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PAYMENT_METHODS = [
  { value: "CHECK", label: "Check" },
  { value: "CASH", label: "Cash" },
  { value: "ELECTRONIC", label: "Electronic/Direct Deposit" },
  { value: "OTHER", label: "Other" },
];

export default function RentCollectionPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new payment
  const [formData, setFormData] = useState({
    clientId: "",
    amountDue: "",
    amountPaid: "",
    paymentDate: "",
    paymentMethod: "",
    checkNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchHouses();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchRentPayments();
  }, [selectedHouse, selectedMonth, selectedYear]);

  const fetchHouses = async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses || []);
  };

  const fetchClients = async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  };

  const fetchRentPayments = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      month: selectedMonth.toString(),
      year: selectedYear.toString(),
    });
    if (selectedHouse !== "all") {
      params.append("house", selectedHouse);
    }
    const res = await fetch(`/api/rent?${params}`);
    const data = await res.json();
    setRentPayments(data.rentPayments || []);
    setLoading(false);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      alert("Please select a client");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/rent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: formData.clientId,
        houseId: client.houseId,
        month: selectedMonth,
        year: selectedYear,
        amountDue: parseFloat(formData.amountDue) || 0,
        amountPaid: parseFloat(formData.amountPaid) || 0,
        paymentDate: formData.paymentDate || null,
        paymentMethod: formData.paymentMethod || null,
        checkNumber: formData.checkNumber || null,
        notes: formData.notes || null,
      }),
    });

    if (res.ok) {
      setIsAddDialogOpen(false);
      setFormData({
        clientId: "",
        amountDue: "",
        amountPaid: "",
        paymentDate: "",
        paymentMethod: "",
        checkNumber: "",
        notes: "",
      });
      fetchRentPayments();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add payment");
    }
    setSubmitting(false);
  };

  const handleSignOff = async (paymentId: string) => {
    if (!confirm("Are you sure you want to sign off on this payment?")) return;

    const res = await fetch(`/api/rent/${paymentId}/sign-off`, {
      method: "POST",
    });

    if (res.ok) {
      fetchRentPayments();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to sign off");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totals = rentPayments.reduce(
    (acc, p) => ({
      due: acc.due + Number(p.amountDue),
      paid: acc.paid + Number(p.amountPaid),
      signedOff: acc.signedOff + (p.signedOffBy ? 1 : 0),
    }),
    { due: 0, paid: 0, signedOff: 0 }
  );

  // Get clients without payment for selected month
  const clientsWithPayment = new Set(rentPayments.map(p => p.clientId));
  const clientsWithoutPayment = clients.filter(
    c => !clientsWithPayment.has(c.id) &&
      (selectedHouse === "all" || c.houseId === selectedHouse)
  );

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Collection</h1>
          <p className="text-slate-600">Track and manage resident rent payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Rent Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(v) => {
                      const client = clients.find(c => c.id === v);
                      setFormData({
                        ...formData,
                        clientId: v,
                        amountDue: client?.rentAmount?.toString() || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsWithoutPayment.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.lastName}, {client.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount Due</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amountDue}
                      onChange={(e) => setFormData({ ...formData, amountDue: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Check Number</Label>
                    <Input
                      value={formData.checkNumber}
                      onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Payment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Label>House</Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="w-40">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.due.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.paid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(totals.due - totals.paid).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Signed Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.signedOff} / {rentPayments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Payments Alert */}
      {clientsWithoutPayment.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Missing Payments</p>
                <p className="text-sm text-yellow-700">
                  {clientsWithoutPayment.length} client(s) have no payment recorded for {MONTHS[selectedMonth - 1]} {selectedYear}:
                  {" "}
                  {clientsWithoutPayment.slice(0, 5).map(c => `${c.firstName} ${c.lastName}`).join(", ")}
                  {clientsWithoutPayment.length > 5 && ` and ${clientsWithoutPayment.length - 5} more`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {MONTHS[selectedMonth - 1]} {selectedYear} Rent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Loading...</p>
          ) : rentPayments.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              No rent payments recorded for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Check Delivery</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Check #</TableHead>
                    <TableHead>Entered By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.client.lastName}, {payment.client.firstName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {payment.house.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.client.checkDeliveryLocation || "Not Set"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${Number(payment.amountDue).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(payment.amountPaid).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payment.paymentDate
                          ? format(new Date(payment.paymentDate), "MM/dd/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>{payment.paymentMethod || "-"}</TableCell>
                      <TableCell>{payment.checkNumber || "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {payment.enteredBy.name}
                      </TableCell>
                      <TableCell>
                        {payment.signedOffBy ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">
                              {payment.signedOffBy.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {!payment.signedOffBy && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSignOff(payment.id)}
                          >
                            Sign Off
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
