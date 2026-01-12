"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Upload, Trash2, Download, ClipboardList, CheckCircle, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";

interface SupportPlan {
  id: string;
  planType: string;
  title: string | null;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  documentUrl: string;
  fileName: string;
  fileSize: number | null;
  notes: string | null;
  uploadedAt: string;
  uploadedBy: { id: string; name: string };
}

const PLAN_TYPES = [
  { value: "CSSP", label: "CSSP (Coordinated Service & Support Plan)" },
  { value: "BEHAVIOR_SUPPORT_PLAN", label: "Behavior Support Plan" },
  { value: "CSSP_ADDENDUM", label: "CSSP Addendum" },
  { value: "COMMITMENT_STATUS", label: "Commitment Status" },
  { value: "HOSPITALIZATION", label: "Hospitalization" },
  { value: "AFTER_VISIT_SUMMARY", label: "After Visit Summary" },
];

const getPlanTypeLabel = (type: string) => {
  const found = PLAN_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

const getPlanStatus = (startDate: string, endDate: string | null) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (isBefore(now, start)) {
    return { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
  }
  if (end && isAfter(now, end)) {
    return { label: "Expired", color: "bg-slate-100 text-slate-600" };
  }
  return { label: "Active", color: "bg-green-100 text-green-800" };
};

export function SupportPlans({ clientId }: { clientId: string }) {
  const [plans, setPlans] = useState<SupportPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    planType: "",
    title: "",
    effectiveStartDate: "",
    effectiveEndDate: "",
    documentUrl: "",
    fileName: "",
    fileSize: 0,
    notes: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [clientId]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/support-plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.supportPlans || []);
      }
    } catch (error) {
      console.error("Error fetching support plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
        setFormData({
          ...formData,
          documentUrl: data.url,
          fileName: file.name,
          fileSize: file.size,
        });
      } else {
        alert("Failed to upload file");
      }
    } catch {
      alert("Error uploading file");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentUrl) {
      alert("Please upload a document first");
      return;
    }
    if (!formData.planType) {
      alert("Please select a plan type");
      return;
    }
    if (!formData.effectiveStartDate) {
      alert("Please enter an effective start date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/support-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: formData.planType,
          title: formData.title || null,
          effectiveStartDate: formData.effectiveStartDate,
          effectiveEndDate: formData.effectiveEndDate || null,
          documentUrl: formData.documentUrl,
          fileName: formData.fileName,
          fileSize: formData.fileSize,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({
          planType: "",
          title: "",
          effectiveStartDate: "",
          effectiveEndDate: "",
          documentUrl: "",
          fileName: "",
          fileSize: 0,
          notes: "",
        });
        fetchPlans();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add support plan");
      }
    } catch {
      alert("Error adding support plan");
    }
    setSubmitting(false);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this support plan?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/support-plans/${planId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPlans();
      } else {
        alert("Failed to delete support plan");
      }
    } catch {
      alert("Error deleting support plan");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group plans by type
  const plansByType = plans.reduce((acc, plan) => {
    if (!acc[plan.planType]) acc[plan.planType] = [];
    acc[plan.planType].push(plan);
    return acc;
  }, {} as Record<string, SupportPlan[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Support Plans
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Support Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Plan Type *</Label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) => setFormData({ ...formData, planType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title (optional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 2024-2025 Annual CSSP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.effectiveStartDate}
                    onChange={(e) => setFormData({ ...formData, effectiveStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Effective End Date</Label>
                  <Input
                    type="date"
                    value={formData.effectiveEndDate}
                    onChange={(e) => setFormData({ ...formData, effectiveEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Document *</Label>
                <div className="mt-2">
                  {formData.documentUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 flex-1 truncate">
                        {formData.fileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, documentUrl: "", fileName: "", fileSize: 0 })}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Document"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this plan..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formData.documentUrl || !formData.planType || !formData.effectiveStartDate}>
                  {submitting ? "Saving..." : "Save Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-slate-500">Loading...</p>
        ) : plans.length === 0 ? (
          <p className="text-center py-8 text-slate-500">
            No support plans uploaded yet
          </p>
        ) : (
          <div className="space-y-6">
            {Object.keys(plansByType).map((planType) => (
              <div key={planType}>
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  {getPlanTypeLabel(planType)}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansByType[planType].map((plan) => {
                      const status = getPlanStatus(plan.effectiveStartDate, plan.effectiveEndDate);
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.title || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(plan.effectiveStartDate), "M/d/yy")}
                              {" - "}
                              {plan.effectiveEndDate
                                ? format(new Date(plan.effectiveEndDate), "M/d/yy")
                                : "No end date"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label === "Active" && <CheckCircle className="mr-1 h-3 w-3" />}
                              {status.label === "Expired" && <AlertCircle className="mr-1 h-3 w-3" />}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="truncate max-w-32">{plan.fileName}</p>
                              <p className="text-slate-400">{formatFileSize(plan.fileSize)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            <p>{format(new Date(plan.uploadedAt), "M/d/yy")}</p>
                            <p className="text-slate-400">{plan.uploadedBy.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <a
                                href={plan.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
