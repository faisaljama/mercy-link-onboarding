"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Calendar,
  XCircle,
  Undo2,
  ClipboardList,
  FileWarning,
} from "lucide-react";
import { format, differenceInDays, differenceInYears, addYears } from "date-fns";

interface Document {
  id: string;
  fileName: string;
  uploadedAt: Date;
}

interface ComplianceItem {
  id: string;
  itemType: string;
  itemName: string;
  dueDate: Date;
  completedDate: Date | null;
  status: string;
  statuteRef: string | null;
  notes: string | null;
  documents: Document[];
  correctiveAction?: string | null;
  correctiveNotes?: string | null;
  correctionDueDate?: Date | null;
  correctionCompleted?: boolean;
}

interface ComplianceChecklistProps {
  items: ComplianceItem[];
  clientId: string;
  admissionDate: Date;
}

function getStatusIcon(status: string, dueDate: Date) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  if (status === "NOT_COMPLETED") {
    return <FileWarning className="h-5 w-5 text-amber-600" />;
  }
  if (status === "OVERDUE") {
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  }
  const daysUntil = differenceInDays(dueDate, new Date());
  if (daysUntil <= 7) {
    return <Clock className="h-5 w-5 text-orange-600" />;
  }
  return <Clock className="h-5 w-5 text-blue-600" />;
}

function getStatusBadge(status: string, dueDate: Date) {
  if (status === "COMPLETED") {
    return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
  }
  if (status === "NOT_COMPLETED") {
    return <Badge className="bg-amber-100 text-amber-800">Not Completed</Badge>;
  }
  if (status === "OVERDUE") {
    const daysOverdue = differenceInDays(new Date(), dueDate);
    return <Badge className="bg-red-100 text-red-800">{daysOverdue} days overdue</Badge>;
  }
  const daysUntil = differenceInDays(dueDate, new Date());
  if (daysUntil === 0) {
    return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge className="bg-orange-100 text-orange-800">Due in {daysUntil} days</Badge>;
  }
  if (daysUntil <= 14) {
    return <Badge className="bg-yellow-100 text-yellow-800">Due in {daysUntil} days</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800">Due {format(dueDate, "MMM d")}</Badge>;
}

function getYearForItem(dueDate: Date, admissionDate: Date): number {
  const yearDiff = differenceInYears(dueDate, admissionDate);
  return Math.max(1, yearDiff + 1);
}

function getYearRange(admissionDate: Date): number[] {
  const currentDate = new Date();
  const yearsActive = differenceInYears(currentDate, admissionDate) + 2; // Show current year + 1 more
  const years: number[] = [];
  for (let i = 1; i <= Math.max(yearsActive, 3); i++) {
    years.push(i);
  }
  return years;
}

export function ComplianceChecklist({ items, clientId, admissionDate }: ComplianceChecklistProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showNotCompletedDialog, setShowNotCompletedDialog] = useState(false);
  const [notCompletedItem, setNotCompletedItem] = useState<ComplianceItem | null>(null);
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [correctiveNotes, setCorrectiveNotes] = useState("");
  const [correctionDueDate, setCorrectionDueDate] = useState("");

  const years = getYearRange(admissionDate);

  const handleMarkComplete = async (itemId: string) => {
    setLoading(itemId);
    try {
      const res = await fetch(`/api/compliance/${itemId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark complete:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleUndoComplete = async (itemId: string) => {
    setLoading(itemId);
    try {
      const res = await fetch(`/api/compliance/${itemId}/undo-complete`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to undo completion:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleNotCompleted = async () => {
    if (!notCompletedItem || !correctiveAction) return;

    setLoading(notCompletedItem.id);
    try {
      const res = await fetch(`/api/compliance/${notCompletedItem.id}/not-completed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctiveAction,
          correctiveNotes,
          correctionDueDate: correctionDueDate || null,
        }),
      });

      if (res.ok) {
        setShowNotCompletedDialog(false);
        setNotCompletedItem(null);
        setCorrectiveAction("");
        setCorrectiveNotes("");
        setCorrectionDueDate("");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark not completed:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleCorrectionComplete = async (itemId: string) => {
    setLoading(itemId);
    try {
      const res = await fetch(`/api/compliance/${itemId}/correction-complete`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to complete correction:", error);
    } finally {
      setLoading(null);
    }
  };

  const openNotCompletedDialog = (item: ComplianceItem) => {
    setNotCompletedItem(item);
    setShowNotCompletedDialog(true);
    setCorrectiveAction("");
    setCorrectiveNotes("");
    setCorrectionDueDate("");
  };

  const generatePlanOfCorrections = () => {
    const notCompletedItems = items.filter(item => item.status === "NOT_COMPLETED");
    if (notCompletedItems.length === 0) return;

    const content = notCompletedItems.map(item => ({
      itemName: item.itemName,
      dueDate: format(new Date(item.dueDate), "MMM d, yyyy"),
      correctiveAction: item.correctiveAction,
      correctiveNotes: item.correctiveNotes,
      correctionDueDate: item.correctionDueDate ? format(new Date(item.correctionDueDate), "MMM d, yyyy") : "Not set",
    }));

    // Create a printable document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Plan of Corrections</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; color: #1e293b; }
            h2 { color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .date { text-align: right; color: #64748b; margin-bottom: 20px; }
            .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .item-header { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
            .item-row { margin: 8px 0; }
            .label { color: #64748b; font-weight: 500; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #000; width: 200px; padding-top: 4px; text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Plan of Corrections</h1>
          <p class="date">Generated: ${format(new Date(), "MMMM d, yyyy")}</p>

          <h2>Items Requiring Correction</h2>
          ${content.map((item, index) => `
            <div class="item">
              <div class="item-header">${index + 1}. ${item.itemName}</div>
              <div class="item-row"><span class="label">Original Due Date:</span> ${item.dueDate}</div>
              <div class="item-row"><span class="label">Corrective Action:</span> ${item.correctiveAction || 'Not specified'}</div>
              ${item.correctiveNotes ? `<div class="item-row"><span class="label">Notes:</span> ${item.correctiveNotes}</div>` : ''}
              <div class="item-row"><span class="label">Correction Due Date:</span> ${item.correctionDueDate}</div>
            </div>
          `).join('')}

          <div class="signature-section">
            <div class="signature-line">Staff Signature / Date</div>
            <div class="signature-line">Supervisor Signature / Date</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter items by year
  const filteredItems = selectedYear === "all"
    ? items
    : items.filter(item => getYearForItem(new Date(item.dueDate), admissionDate).toString() === selectedYear);

  const notCompletedCount = items.filter(i => i.status === "NOT_COMPLETED").length;

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No compliance items in this category
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedYear} onValueChange={setSelectedYear} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All Years</TabsTrigger>
            {years.map(year => (
              <TabsTrigger key={year} value={year.toString()}>
                Year {year}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {notCompletedCount > 0 && (
          <Button variant="outline" size="sm" onClick={generatePlanOfCorrections}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Generate Plan of Corrections ({notCompletedCount})
          </Button>
        )}
      </div>

      {/* Year Info */}
      {selectedYear !== "all" && (
        <div className="text-sm text-slate-500">
          Year {selectedYear}: {format(addYears(admissionDate, parseInt(selectedYear) - 1), "MMM d, yyyy")} - {format(addYears(admissionDate, parseInt(selectedYear)), "MMM d, yyyy")}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No compliance items for Year {selectedYear}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                item.status === "OVERDUE"
                  ? "border-red-200 bg-red-50"
                  : item.status === "COMPLETED"
                  ? "border-green-200 bg-green-50"
                  : item.status === "NOT_COMPLETED"
                  ? "border-amber-200 bg-amber-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="mt-0.5">{getStatusIcon(item.status, new Date(item.dueDate))}</div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    {item.statuteRef && (
                      <p className="text-xs text-slate-500">{item.statuteRef}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Year {getYearForItem(new Date(item.dueDate), admissionDate)}
                    </Badge>
                    {getStatusBadge(item.status, new Date(item.dueDate))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                  </span>
                  {item.completedDate && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed: {format(new Date(item.completedDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {item.documents.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {item.documents.length} document(s)
                    </span>
                  )}
                </div>

                {item.notes && (
                  <p className="text-sm text-slate-600 mt-2">{item.notes}</p>
                )}

                {/* Plan of Corrections info */}
                {item.status === "NOT_COMPLETED" && item.correctiveAction && (
                  <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-1">Plan of Corrections:</p>
                    <p className="text-sm text-slate-600">{item.correctiveAction}</p>
                    {item.correctiveNotes && (
                      <p className="text-sm text-slate-500 mt-1">{item.correctiveNotes}</p>
                    )}
                    {item.correctionDueDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Correction due: {format(new Date(item.correctionDueDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {item.status === "NOT_COMPLETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCorrectionComplete(item.id)}
                    disabled={loading === item.id}
                    className="text-green-600 hover:bg-green-50"
                  >
                    {loading === item.id ? "Saving..." : "Correction Done"}
                  </Button>
                )}
                {item.status === "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUndoComplete(item.id)}
                    disabled={loading === item.id}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    {loading === item.id ? "..." : "Undo"}
                  </Button>
                )}
                {item.status !== "COMPLETED" && item.status !== "NOT_COMPLETED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkComplete(item.id)}
                      disabled={loading === item.id}
                    >
                      {loading === item.id ? "Saving..." : "Complete"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openNotCompletedDialog(item)}
                      className="text-amber-600 hover:bg-amber-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Not Done
                    </Button>
                  </>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>
                        Upload a document for "{item.itemName}"
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Select File</Label>
                        <Input id="file" type="file" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Input id="notes" placeholder="Add any notes about this document" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Upload</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Not Completed Dialog */}
      <Dialog open={showNotCompletedDialog} onOpenChange={setShowNotCompletedDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark as Not Completed</DialogTitle>
            <DialogDescription>
              {notCompletedItem && (
                <>Create a plan of corrections for "{notCompletedItem.itemName}"</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correctiveAction">Corrective Action *</Label>
              <Textarea
                id="correctiveAction"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Describe what will be done to complete this requirement..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correctiveNotes">Additional Notes</Label>
              <Textarea
                id="correctiveNotes"
                value={correctiveNotes}
                onChange={(e) => setCorrectiveNotes(e.target.value)}
                placeholder="Any additional context or notes..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correctionDueDate">Correction Due Date</Label>
              <Input
                id="correctionDueDate"
                type="date"
                value={correctionDueDate}
                onChange={(e) => setCorrectionDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotCompletedDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleNotCompleted}
              disabled={!correctiveAction || loading === notCompletedItem?.id}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading === notCompletedItem?.id ? "Saving..." : "Save Plan of Corrections"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
