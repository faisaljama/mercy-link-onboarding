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
import { FileText, Plus, Upload, Trash2, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

interface MonthlySummary {
  id: string;
  month: number;
  year: number;
  title: string;
  documentUrl: string;
  fileName: string;
  fileSize: number | null;
  notes: string | null;
  uploadedAt: string;
  uploadedBy: { id: string; name: string };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MonthlySummaries({ clientId }: { clientId: string }) {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: (currentDate.getMonth() + 1).toString(),
    year: currentDate.getFullYear().toString(),
    title: "",
    documentUrl: "",
    fileName: "",
    fileSize: 0,
    notes: "",
  });

  useEffect(() => {
    fetchSummaries();
  }, [clientId]);

  const fetchSummaries = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/summaries`);
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries || []);
      }
    } catch (error) {
      console.error("Error fetching summaries:", error);
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

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/summaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          title: formData.title || `${MONTHS[parseInt(formData.month) - 1]} ${formData.year} Summary`,
          documentUrl: formData.documentUrl,
          fileName: formData.fileName,
          fileSize: formData.fileSize,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({
          month: (currentDate.getMonth() + 1).toString(),
          year: currentDate.getFullYear().toString(),
          title: "",
          documentUrl: "",
          fileName: "",
          fileSize: 0,
          notes: "",
        });
        fetchSummaries();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add summary");
      }
    } catch {
      alert("Error adding summary");
    }
    setSubmitting(false);
  };

  const handleDelete = async (summaryId: string) => {
    if (!confirm("Are you sure you want to delete this summary?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/summaries/${summaryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSummaries();
      } else {
        alert("Failed to delete summary");
      }
    } catch {
      alert("Error deleting summary");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  // Group summaries by year
  const summariesByYear = summaries.reduce((acc, summary) => {
    if (!acc[summary.year]) acc[summary.year] = [];
    acc[summary.year].push(summary);
    return acc;
  }, {} as Record<number, MonthlySummary[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Monthly Summaries
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Summary
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Monthly Summary</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Month</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(v) => setFormData({ ...formData, month: v })}
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
                <div>
                  <Label>Year</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(v) => setFormData({ ...formData, year: v })}
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

              <div>
                <Label>Title (optional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`${MONTHS[parseInt(formData.month) - 1]} ${formData.year} Summary`}
                />
              </div>

              <div>
                <Label>Document</Label>
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
                  placeholder="Any additional notes about this summary..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formData.documentUrl}>
                  {submitting ? "Saving..." : "Save Summary"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-slate-500">Loading...</p>
        ) : summaries.length === 0 ? (
          <p className="text-center py-8 text-slate-500">
            No monthly summaries uploaded yet
          </p>
        ) : (
          <div className="space-y-6">
            {Object.keys(summariesByYear)
              .sort((a, b) => Number(b) - Number(a))
              .map((year) => (
                <div key={year}>
                  <h4 className="font-medium text-slate-700 mb-3">{year}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summariesByYear[Number(year)].map((summary) => (
                        <TableRow key={summary.id}>
                          <TableCell className="font-medium">
                            {MONTHS[summary.month - 1]}
                          </TableCell>
                          <TableCell>{summary.title}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="truncate max-w-32">{summary.fileName}</p>
                              <p className="text-slate-400">{formatFileSize(summary.fileSize)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            <p>{format(new Date(summary.uploadedAt), "MMM d, yyyy")}</p>
                            <p className="text-slate-400">{summary.uploadedBy.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <a
                                href={summary.documentUrl}
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
                                onClick={() => handleDelete(summary.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
