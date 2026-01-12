"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Upload, FileText, X } from "lucide-react";
import { format } from "date-fns";

interface Agreement {
  id: string;
  agreementNumber: string | null;
  serviceType: string;
  startDate: Date;
  endDate: Date;
  dailyRate: unknown;
  units: unknown;
  documentUrl: string | null;
  documentName: string | null;
  status: string;
  notes: string | null;
}

const SERVICE_TYPES = [
  { value: "CRS", label: "CRS - Community Residential Setting" },
  { value: "ICS", label: "ICS - In-Home Family Child Care" },
  { value: "IHS_WITH_TRAINING", label: "IHS with Training" },
  { value: "IHS_WITHOUT_TRAINING", label: "IHS without Training" },
  { value: "NIGHT_SUPERVISION", label: "Night Supervision" },
  { value: "HOMEMAKING", label: "Homemaking" },
  { value: "EA_24_HOUR", label: "EA 24-Hour" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "EXPIRED", label: "Expired" },
  { value: "TERMINATED", label: "Terminated" },
];

export function EditAgreementForm({ agreement }: { agreement: Agreement }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    agreementNumber: agreement.agreementNumber || "",
    serviceType: agreement.serviceType,
    startDate: format(new Date(agreement.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(agreement.endDate), "yyyy-MM-dd"),
    dailyRate: String(Number(agreement.dailyRate)),
    units: agreement.units ? String(Number(agreement.units)) : "",
    status: agreement.status,
    notes: agreement.notes || "",
  });

  const [document, setDocument] = useState<{ url: string; name: string } | null>(
    agreement.documentUrl
      ? { url: agreement.documentUrl, name: agreement.documentName || "Document" }
      : null
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", "document");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload document");
      }

      const data = await res.json();
      setDocument({ url: data.url, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/billing/${agreement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dailyRate: parseFloat(formData.dailyRate),
          units: formData.units ? parseFloat(formData.units) : null,
          documentUrl: document?.url,
          documentName: document?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update service agreement");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update service agreement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agreement Number and Service Type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agreementNumber">Agreement Number</Label>
          <Input
            id="agreementNumber"
            value={formData.agreementNumber}
            onChange={(e) =>
              setFormData({ ...formData, agreementNumber: e.target.value })
            }
            placeholder="e.g., SA-2024-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceType">Service Type *</Label>
          <Select
            value={formData.serviceType}
            onValueChange={(value) =>
              setFormData({ ...formData, serviceType: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Daily Rate, Units, and Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
          <Input
            id="dailyRate"
            type="number"
            step="0.01"
            min="0"
            value={formData.dailyRate}
            onChange={(e) =>
              setFormData({ ...formData, dailyRate: e.target.value })
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="units">Units</Label>
          <Input
            id="units"
            type="number"
            step="0.01"
            min="0"
            value={formData.units}
            onChange={(e) =>
              setFormData({ ...formData, units: e.target.value })
            }
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Upload */}
      <div className="space-y-3">
        <Label>Service Agreement Document</Label>
        {document ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="flex-1 text-sm truncate">{document.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeDocument}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : (
                <Upload className="h-8 w-8 text-slate-400" />
              )}
              <span className="text-sm text-slate-600">
                {uploading ? "Uploading..." : "Click to upload document"}
              </span>
              <span className="text-xs text-slate-400">
                PDF, DOC, DOCX up to 10MB
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Additional notes about this agreement..."
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
          Service agreement updated successfully!
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            loading ||
            !formData.serviceType ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.dailyRate
          }
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
