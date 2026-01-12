"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Receipt,
  Plus,
  FileDown,
  Building2,
  Upload,
  Trash2,
  Image,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { downloadPDF } from "@/lib/pdf-service";
import { ExpensesPDF, getExpensesFilename } from "@/lib/pdf-templates/expenses-pdf";

interface House {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  houseId: string;
}

interface Expense {
  id: string;
  houseId: string;
  date: string;
  amount: number;
  category: string;
  vendor: string | null;
  description: string | null;
  receiptUrl: string | null;
  purchasedBy: { id: string; name: string };
  participants: string | null;
  month: number;
  year: number;
  isConfirmed: boolean;
  house: { id: string; name: string };
  createdBy: { id: string; name: string };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EXPENSE_CATEGORIES = [
  { value: "GROCERIES", label: "Groceries" },
  { value: "HOUSEHOLD", label: "Household Supplies" },
  { value: "ACTIVITIES", label: "Activities/Outings" },
  { value: "MEDICAL", label: "Medical" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "OTHER", label: "Other" },
];

export default function ExpensesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    houseId: "",
    date: "",
    amount: "",
    category: "",
    vendor: "",
    description: "",
    receiptUrl: "",
    purchasedById: "",
    participants: [] as string[],
  });

  useEffect(() => {
    fetchHouses();
    fetchUsers();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedHouse, selectedMonth, selectedYear]);

  const fetchHouses = async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses || []);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchClients = async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      month: selectedMonth.toString(),
      year: selectedYear.toString(),
    });
    if (selectedHouse !== "all") {
      params.append("house", selectedHouse);
    }
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "document");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, receiptUrl: data.url });
      } else {
        alert("Failed to upload receipt");
      }
    } catch {
      alert("Error uploading receipt");
    }
    setUploadingReceipt(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        houseId: formData.houseId,
        date: formData.date,
        amount: parseFloat(formData.amount) || 0,
        category: formData.category,
        vendor: formData.vendor || null,
        description: formData.description || null,
        receiptUrl: formData.receiptUrl || null,
        purchasedById: formData.purchasedById,
        participants: formData.participants.length > 0 ? formData.participants : null,
      }),
    });

    if (res.ok) {
      setIsAddDialogOpen(false);
      setFormData({
        houseId: "",
        date: "",
        amount: "",
        category: "",
        vendor: "",
        description: "",
        receiptUrl: "",
        purchasedById: "",
        participants: [],
      });
      fetchExpenses();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add expense");
    }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchExpenses();
    } else {
      alert("Failed to delete expense");
    }
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const houseName = selectedHouse !== "all"
        ? houses.find(h => h.id === selectedHouse)?.name
        : undefined;
      const filename = getExpensesFilename(selectedMonth, selectedYear);
      await downloadPDF(
        <ExpensesPDF
          expenses={expenses}
          month={selectedMonth}
          year={selectedYear}
          houseName={houseName}
        />,
        filename
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Calculate totals by category
  const totalsByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Get clients for selected house
  const houseClients = clients.filter(
    c => formData.houseId === "" || c.houseId === formData.houseId
  );

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">House Expenses</h1>
          <p className="text-slate-600">Track purchases and receipts by house</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={generatingPDF}>
            {generatingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <Label>House *</Label>
                  <Select
                    value={formData.houseId}
                    onValueChange={(v) => setFormData({ ...formData, houseId: v, participants: [] })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="Store/vendor name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What was purchased?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Purchased By *</Label>
                  <Select
                    value={formData.purchasedById}
                    onValueChange={(v) => setFormData({ ...formData, purchasedById: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Who made the purchase?" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.houseId && houseClients.length > 0 && (
                  <div>
                    <Label>Participants (who was part of this activity?)</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {houseClients.map((client) => (
                        <div key={client.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`participant-${client.id}`}
                            checked={formData.participants.includes(
                              `${client.firstName} ${client.lastName}`
                            )}
                            onCheckedChange={(checked) => {
                              const name = `${client.firstName} ${client.lastName}`;
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  participants: [...formData.participants, name],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  participants: formData.participants.filter((p) => p !== name),
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor={`participant-${client.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {client.firstName} {client.lastName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Receipt</Label>
                  <div className="mt-2">
                    {formData.receiptUrl ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Image className="h-3 w-3" />
                          Receipt uploaded
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, receiptUrl: "" })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingReceipt}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadingReceipt ? "Uploading..." : "Upload Receipt"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Expense"}
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {EXPENSE_CATEGORIES.map((cat) => (
          <Card key={cat.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">{cat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${(totalsByCategory[cat.value] || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-700">${grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {MONTHS[selectedMonth - 1]} {selectedYear} Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              No expenses recorded for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Purchased By</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const participants = expense.participants
                      ? JSON.parse(expense.participants)
                      : [];
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), "MM/dd/yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {expense.house.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label ||
                              expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell className="max-w-48 truncate">
                          {expense.description || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(expense.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{expense.purchasedBy.name}</TableCell>
                        <TableCell className="max-w-32">
                          {participants.length > 0 ? (
                            <span className="text-xs text-slate-600">
                              {participants.slice(0, 2).join(", ")}
                              {participants.length > 2 && ` +${participants.length - 2}`}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {expense.receiptUrl ? (
                            <a
                              href={expense.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      </div>
  );
}
