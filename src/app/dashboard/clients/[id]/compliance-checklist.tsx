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
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

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
}

interface ComplianceChecklistProps {
  items: ComplianceItem[];
  clientId: string;
}

function getStatusIcon(status: string, dueDate: Date) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
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

export function ComplianceChecklist({ items, clientId }: ComplianceChecklistProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);

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

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No compliance items in this category
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
            item.status === "OVERDUE"
              ? "border-red-200 bg-red-50"
              : item.status === "COMPLETED"
              ? "border-green-200 bg-green-50"
              : "hover:bg-slate-50"
          }`}
        >
          <div className="mt-0.5">{getStatusIcon(item.status, item.dueDate)}</div>

          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.itemName}</p>
                {item.statuteRef && (
                  <p className="text-xs text-slate-500">{item.statuteRef}</p>
                )}
              </div>
              {getStatusBadge(item.status, item.dueDate)}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due: {format(item.dueDate, "MMM d, yyyy")}
              </span>
              {item.completedDate && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed: {format(item.completedDate, "MMM d, yyyy")}
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
          </div>

          <div className="flex gap-2">
            {item.status !== "COMPLETED" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkComplete(item.id)}
                disabled={loading === item.id}
              >
                {loading === item.id ? "Saving..." : "Mark Complete"}
              </Button>
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
      ))}
    </div>
  );
}
